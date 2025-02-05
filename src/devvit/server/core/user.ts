// NOTE: This is all global redis!
import type {Devvit} from '@devvit/public-api'
import {NoProfile} from '../../../shared/save'
import type {T2} from '../../../shared/types/tid'

type User = {
  /** Player user ID. t2_0 for anons. */
  t2: T2
  /** Player username. eg, spez. */
  username: string
}

const userKey = 'users'

export const userMaybeGet = async ({
  redis,
  userId,
}: {
  redis: Devvit.Context['redis']
  userId: string
}): Promise<User | undefined> => {
  const user = await redis.global.hGet(userKey, userId)

  if (!user) {
    return undefined
  }

  return JSON.parse(user)
}

export const userGet = async (args: {
  redis: Devvit.Context['redis']
  userId: string
}): Promise<User | undefined> => {
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
  user: User
}): Promise<void> => {
  await redis.global.hSet(userKey, {
    [user.t2]: JSON.stringify(user),
  })
}

export const userGetOrSet = async ({
  ctx,
}: {
  ctx: Devvit.Context
}): Promise<User> => {
  if (!ctx.userId) return NoProfile()

  const maybeProfile = await userMaybeGet({
    redis: ctx.redis,
    userId: ctx.userId,
  })

  if (maybeProfile) return maybeProfile

  const userProfile = await ctx.reddit.getUserById(ctx.userId)
  if (!userProfile) return NoProfile()

  const user: User = {
    t2: userProfile.id,
    username: userProfile.username,
  }

  await userSet({
    redis: ctx.redis,
    user,
  })

  return user
}
