import type {User} from '@devvit/public-api'
import {beforeEach, expect, vi} from 'vitest'
import type {Profile} from '../../../shared/save'
import type {T2} from '../../../shared/types/tid'
import {DevvitTest} from './_utils/DevvitTest'
import * as userMethods from './user'

beforeEach(() => {
  DevvitTest.resetRedis()
  vi.resetAllMocks()
})

DevvitTest.it('userGetOrSet - return defaults if no user found', async ctx => {
  await expect(
    userMethods.userGetOrSet({ctx: {...ctx, userId: undefined}}),
  ).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: 't2_0',
    username: 'anonymous',
    superuser: false,
    hasVerifiedEmail: true,
  } satisfies Profile)
})

DevvitTest.it('userGetOrSet - return username and cache', async ctx => {
  const spy = vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
  } satisfies Profile)

  await expect(
    userMethods.userGet({redis: ctx.redis, userId: ctx.userId as T2}),
  ).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
  } satisfies Profile)

  expect(spy).toHaveBeenCalledTimes(1)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
  } satisfies Profile)
  expect(spy).toHaveBeenCalledTimes(1)
})

DevvitTest.it('userGetOrSet - set superuser', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: true,
    hasVerifiedEmail: true,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: true,
    hasVerifiedEmail: true,
  } satisfies Profile)
})

DevvitTest.it('makeSuperuser - sets the user to be a superuser', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
  } satisfies Profile)

  await userMethods.userMakeSuperuser({
    redis: ctx.redis,
    userId: ctx.userId as T2,
  })

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: true,
    hasVerifiedEmail: true,
  } satisfies Profile)
})

DevvitTest.it('can block and unblock a user', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  const unbannedUser: Profile = {
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
  }

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual(
    unbannedUser,
  )

  await userMethods.userBlock({redis: ctx.redis, userId: ctx.userId as T2})

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    ...unbannedUser,
    blocked: expect.any(String),
  } satisfies Profile)

  await userMethods.userUnblock({redis: ctx.redis, userId: ctx.userId as T2})

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual(
    unbannedUser,
  )
})

DevvitTest.it('saves verified email value', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: false,
  } as User)

  const user: Profile = {
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: false,
  }

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual(user)
})
