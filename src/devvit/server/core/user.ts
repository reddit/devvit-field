// NOTE: This is all global redis!
import type {Devvit} from '@devvit/public-api'
import type {Profile} from '../../../shared/save'
import {noT2, noUsername} from '../../../shared/types/tid'
import {globalStatsIncrement} from './globalStats'

export function noProfile(): Profile {
  return {t2: noT2, username: noUsername, superuser: false}
}

const userKey = 'users'

export const userMaybeGet = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: string
}): Promise<Profile | undefined> => {
  const user = await redis.global.hGet(userKey, userId)

  if (!user) {
    return undefined
  }

  return JSON.parse(user)
}

export const userGet = async (args: {
  redis: Devvit.Context['redis']
  userId: string
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
  await redis.global.hSet(userKey, {
    [user.t2]: JSON.stringify(user),
  })
}

export const userGetOrSet = async ({
  ctx,
}: {
  ctx: Devvit.Context
}): Promise<Profile> => {
  if (!ctx.userId) return noProfile()

  const maybeProfile = await userMaybeGet({
    redis: ctx.redis,
    userId: ctx.userId,
  })

  if (maybeProfile) return maybeProfile

  const userProfile = await ctx.reddit.getUserById(ctx.userId)
  if (!userProfile) return noProfile()

  const user: Profile = {
    t2: userProfile.id,
    username: userProfile.username,
    superuser: false,
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
  userId: string
}): Promise<void> => {
  const user = await userGet({redis, userId})

  await userSet({redis, user: {...user, superuser: true}})
}
