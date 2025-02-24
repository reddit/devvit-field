// NOTE: This is all global redis!
import type {Devvit} from '@devvit/public-api'
import type {Profile} from '../../../shared/save'
import {getTeamFromUserId} from '../../../shared/team'
import type {Level} from '../../../shared/types/level'
import {type T2, noT2, noUsername} from '../../../shared/types/tid'
import {globalStatsIncrement} from './globalStats'
import {leaderboardIncrementForTeam} from './leaderboards/global/leaderboard'
import {levels} from './levels'

export function noProfile(): Profile {
  return {
    t2: noT2,
    username: noUsername,
    superuser: false,
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
  }
}

const getUserKey = (userId: T2) => `user:${userId}` as const

export const userMaybeGet = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<Profile | undefined> => {
  const user = await redis.global.get(getUserKey(userId))

  if (!user) {
    return undefined
  }

  return JSON.parse(user)
}

export const userGet = async (args: {
  redis: Devvit.Context['redis']
  userId: T2
}): Promise<Profile> => {
  const user = await userMaybeGet(args)

  if (!user) {
    throw new Error('No user found')
  }

  return user
}

export const userSet = async ({
  redis,
  user,
}: {
  redis: Devvit.Context['redis']
  user: Profile
}): Promise<void> => {
  await redis.global.set(getUserKey(user.t2), JSON.stringify(user))
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
  }

  await userSet({
    redis: ctx.redis,
    user,
  })

  await globalStatsIncrement({
    redis: ctx.redis,
    globalNumber: 0,
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
  const lastLevel = Object.keys(levels).length - 1
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
}): Promise<number> => {
  const user = await userGet({redis, userId})

  const levelExists = levels.find(x => x.id === level)

  if (!levelExists) {
    throw new Error('Level does not exist')
  }

  if (user.currentLevel === level) return user.currentLevel

  await userSet({
    redis,
    user: {...user, currentLevel: level, lastPlayedChallengeNumberForLevel: 0},
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
    user: {...user, lastPlayedChallengeNumberForLevel: challengeNumber},
  })

  return challengeNumber
}

export const userAttemptToClaimSpecialPointForTeam = async ({
  ctx,
  userId,
}: {
  ctx: Devvit.Context
  userId: T2
}): Promise<{success: boolean}> => {
  const user = await userGet({redis: ctx.redis, userId})

  const lastLevel = levels[levels.length - 1]!

  const levelForUser = levels.find(x => x.id === user.currentLevel)
  if (!levelForUser) {
    throw new Error(`No level found for current level ${user.currentLevel}`)
  }

  // Not on the last level
  if (levelForUser.id !== lastLevel.id) {
    return {success: false}
  }

  // We pull off of context and do this extra check in case someone tries to forge
  // the subreddit ID. I hope that gateway prevents context spoofing.
  const levelForSub = levels.find(x => x.subredditId === ctx.subredditId)
  if (!levelForSub) {
    throw new Error(`No level found for subreddit ${ctx.subredditId}`)
  }

  // Subreddit is not the last level
  if (lastLevel.id !== levelForSub.id) {
    return {success: false}
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

  return {success: true}
}
