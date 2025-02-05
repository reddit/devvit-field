import {expect, vi} from 'vitest'
import type {T2} from '../../../shared/types/tid'
import {DevvitTest} from './_utils/DevvitTest'
import * as userMethods from './user'

DevvitTest.it('userGetOrSet - return defaults if no user found', async ctx => {
  await expect(
    userMethods.userGetOrSet({ctx: {...ctx, userId: undefined}}),
  ).resolves.toEqual({
    t2: 't2_0',
    username: 'anonymous',
  })
})

DevvitTest.it('userGetOrSet - return username and cache', async ctx => {
  // @ts-expect-error - testing and don't need all methods
  const spy = vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
  })

  await expect(userMethods.userGetOrSet({ctx})).resolves.toEqual({
    t2: ctx.userId as T2,
    username: 'foo',
  })
  await expect(
    userMethods.userGet({redis: ctx.redis, userId: ctx.userId as T2}),
  ).resolves.toEqual({
    t2: ctx.userId as T2,
    username: 'foo',
  })

  expect(spy).toHaveBeenCalledTimes(1)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toEqual({
    t2: ctx.userId as T2,
    username: 'foo',
  })
  expect(spy).toHaveBeenCalledTimes(1)
})
