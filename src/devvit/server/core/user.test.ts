import type {User} from '@devvit/public-api'
import {beforeEach, expect, vi} from 'vitest'
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
  ).resolves.toEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    t2: 't2_0',
    username: 'anonymous',
    superuser: false,
  })
})

DevvitTest.it('userGetOrSet - return username and cache', async ctx => {
  const spy = vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
  })
  await expect(
    userMethods.userGet({redis: ctx.redis, userId: ctx.userId as T2}),
  ).resolves.toEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
  })

  expect(spy).toHaveBeenCalledTimes(1)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
  })
  expect(spy).toHaveBeenCalledTimes(1)
})

DevvitTest.it('userGetOrSet - set superuser', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: true,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: true,
  })
})

DevvitTest.it('makeSuperuser - sets the user to be a superuser', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
  })

  await userMethods.userMakeSuperuser({
    redis: ctx.redis,
    userId: ctx.userId as T2,
  })

  await expect(userMethods.userGetOrSet({ctx})).resolves.toEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: true,
  })
})
