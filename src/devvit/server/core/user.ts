// NOTE: This is all global redis!
import type {Devvit} from '@devvit/public-api'
import type {Profile} from '../../../shared/save'
import {getTeamFromUserId} from '../../../shared/team'
import {type Level, config2} from '../../../shared/types/level'
import {type T2, noT2, noUsername} from '../../../shared/types/tid'
import {globalStatsIncrement} from './globalStats'
import {leaderboardIncrementForTeam} from './leaderboards/global/leaderboard'

export function noProfile(): Profile {
  return {
    t2: noT2,
    username: noUsername,
    superuser: false,
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  }
}

// 2 because I switch this over to a hash and we don't have a way
// to truncate redis for an app at the moment
const getUserKey = (userId: T2) => `user7:${userId}` as const

export const userMaybeGet = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<Profile | undefined> => {
  const user = await redis.global.hGetAll(getUserKey(userId))

  if (Object.keys(user).length === 0) {
    return undefined
  }

  return deserialize(user)
}

export const userGet = async (args: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<Profile> => {
  const user = await userMaybeGet(args)

  if (!user) {
    throw new Error(`No user found: ${args.userId}`)
  }

  return user
}

export const userSet = async ({
  redis,
  user,
}: {
  redis: Devvit.Context['redis']
  // TODO: Shouldn't need to submit the entire user anymore since we're using a hash
  user: Profile
}): Promise<void> => {
  await redis.global.hSet(getUserKey(user.t2), serialize(user))
}

/**
 * Sets a UTC date string for when the user started playing the game. This is
 * set globally and once for the entire lifecycle of the user.
 */
export const userSetPlayedIfNotExists = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<void> => {
  await redis.global.hSetNX(
    getUserKey(userId),
    'startedPlayingAt' satisfies keyof Profile,
    new Date().toISOString(),
  )
}

export const userGetOrSet = async ({
  ctx,
}: {
  ctx: Devvit.Context
}): Promise<Profile> => {
  if (!ctx.userId) return noProfile()

  const maybeProfile = await userMaybeGet({
    redis: ctx.redis,
    userId: ctx.userId as T2,
  })

  if (maybeProfile) return maybeProfile

  const userProfile = await ctx.reddit.getUserById(ctx.userId)
  if (!userProfile) return noProfile()

  const user: Profile = {
    t2: userProfile.id,
    username: userProfile.username,
    superuser: userProfile.isAdmin,
    // Defaults to 0 if the user is new, doesn't matter the subreddit
    // this was initially called on.
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    hasVerifiedEmail: userProfile.hasVerifiedEmail,
    globalPointCount: 0,
  }

  await userSet({
    redis: ctx.redis,
    user,
  })

  await globalStatsIncrement({
    redis: ctx.redis,
    field: 'totalPlayers',
  })

  return user
}

/** Makes a given user a super user */
export const userMakeSuperuser = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<void> => {
  const user = await userGet({redis, userId})

  await userSet({redis, user: {...user, superuser: true}})
}

/**
 * Promotes the user to a higher level. Level 0 is the highest level and
 * level 4 is the lowest. If the user is already at level 0, this function
 * does nothing.
 */
export const userAscendLevel = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<Level> => {
  const user = await userGet({redis, userId})

  let newLevel = user.currentLevel - 1
  if (newLevel < 0) {
    newLevel = 0 as Level
  }

  if (user.currentLevel === newLevel) return user.currentLevel

  await userSet({
    redis,
    user: {
      ...user,
      currentLevel: newLevel as Level,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
    },
  })

  return newLevel as Level
}

/**
 * Demotes the user to a lower level. Level 0 is the highest level and
 * level 4 is the lowest. If the user is already at level 4, this function
 * does nothing.
 */
export const userDescendLevel = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<Level> => {
  const user = await userGet({redis, userId})

  let newLevel = user.currentLevel + 1
  const lastLevel = Object.keys(config2.levels).length - 1
  if (newLevel > lastLevel) {
    newLevel = lastLevel
  }

  if (user.currentLevel === newLevel) return user.currentLevel

  await userSet({
    redis,
    user: {
      ...user,
      currentLevel: newLevel as Level,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
    },
  })

  return newLevel as Level
}

export const userSetLevel = async ({
  redis,
  userId,
  level,
}: {
  redis: Devvit.Context['redis']
  userId: T2
  level: Level
}): Promise<Level> => {
  const user = await userGet({redis, userId})

  const levelExists = config2.levels.find(x => x.id === level)

  if (!levelExists) {
    throw new Error('Level does not exist')
  }

  if (user.currentLevel === level) return user.currentLevel

  await userSet({
    redis,
    user: {
      ...user,
      currentLevel: level,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
    },
  })

  return level
}

export const userSetLastPlayedChallenge = async ({
  redis,
  userId,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  userId: T2
  challengeNumber: number
}): Promise<number> => {
  const user = await userGet({redis, userId})

  if (user.lastPlayedChallengeNumberForLevel === challengeNumber)
    return user.currentLevel

  await userSet({
    redis,
    user: {
      ...user,
      t2: userId, // technically duplicative, but helps not break things for load tests / bot users
      lastPlayedChallengeNumberForLevel: challengeNumber,
    },
  })

  return challengeNumber
}

export const userIncrementLastPlayedChallengeClaimedCells = async ({
  redis,
  userId,
  incrementBy = 1,
}: {
  redis: Devvit.Context['redis']
  userId: T2
  incrementBy?: number
}): Promise<number> => {
  return await redis.global.hIncrBy(
    getUserKey(userId),
    'lastPlayedChallengeNumberCellsClaimed' as keyof Profile,
    incrementBy,
  )
}

export const userBlock = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<void> => {
  const user = await userGet({redis, userId})

  await userSet({
    redis,
    user: {...user, blocked: new Date().toISOString()},
  })
}

export const userUnblock = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<void> => {
  await redis.global.hDel(getUserKey(userId), [
    'blocked',
  ] satisfies (keyof Profile)[])
}

export const userAttemptToClaimGlobalPointForTeam = async ({
  ctx,
  userId,
}: {
  ctx: Devvit.Context
  userId: T2
}): Promise<void> => {
  const user = await userGet({redis: ctx.redis, userId})

  const lastLevel = config2.levels.at(-1)!

  const levelForUser = config2.levels.find(x => x.id === user.currentLevel)
  if (!levelForUser) {
    throw new Error(`No level found for current level ${user.currentLevel}`)
  }

  // Not on the last level
  if (levelForUser.id !== lastLevel.id) {
    throw new Error('User is not on the last level')
  }

  // We pull off of context and do this extra check in case someone tries to forge
  // the subreddit ID. I hope that gateway prevents context spoofing.
  const levelForSub = config2.levels.find(
    x => x.subredditId === ctx.subredditId,
  )
  if (!levelForSub) {
    throw new Error(`No level found for subreddit ${ctx.subredditId}`)
  }

  // Subreddit is not the last level
  if (lastLevel.id !== levelForSub.id) {
    throw new Error('Subreddit is not the last level')
  }

  await leaderboardIncrementForTeam({
    member: getTeamFromUserId(userId),
    redis: ctx.redis,
    incrementBy: 1,
  })

  // Set user back to the start after they claim a point
  await userSetLevel({
    level: 0,
    redis: ctx.redis,
    userId,
  })

  await ctx.redis.global.hIncrBy(
    getUserKey(userId),
    'globalPointCount' satisfies keyof Profile,
    1,
  )
}

export const userDeleteStartedPlayingAt = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<void> => {
  await redis.global.hDel(getUserKey(userId), ['startedPlayingAt'])
}

function serialize(config: Partial<Profile>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (value === undefined) {
        return [key, '']
      }
      return [key, value.toString()]
    }),
  )
}

function deserialize(config: Record<string, string>): Profile {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      let val

      const numberKeys: (keyof Profile)[] = [
        'currentLevel',
        'lastPlayedChallengeNumberCellsClaimed',
        'lastPlayedChallengeNumberForLevel',
        'globalPointCount',
      ]
      if (numberKeys.includes(key as keyof Profile)) {
        val = parseFloat(value)
        if (Number.isNaN(val)) {
          throw new Error(`Invalid number for key: ${key}`)
        }
        return [key, val]
      }

      const boolKeys: (keyof Profile)[] = ['superuser', 'hasVerifiedEmail']
      if (boolKeys.includes(key as keyof Profile)) {
        val = value === 'true'
        return [key, val]
      }

      return [key, value]
    }),
  ) as Profile
}
