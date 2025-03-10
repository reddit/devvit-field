import {expect} from 'vitest'
import type {Delta} from '../../../shared/types/field'
import {DevvitTest} from './_utils/DevvitTest'
import {deltasAdd, deltasClear, deltasGet} from './deltas'

DevvitTest.it('should be able to add, get, and remove deltas', async ctx => {
  const challengeNumber = 0
  await expect(
    deltasGet(ctx.redis, challengeNumber, {x: 0, y: 0}),
  ).resolves.toEqual([])

  const deltasOne: Delta[] = [
    {
      globalXY: {x: 0, y: 0},
      team: 0,
      isBan: false,
    },
    {
      globalXY: {x: 1, y: 0},
      team: 1,
      isBan: false,
    },
  ]

  const deltasTwo: Delta[] = [
    {
      globalXY: {x: 25, y: 25},
      team: 0,
      isBan: false,
    },
  ]

  await deltasAdd(ctx.redis, challengeNumber, {x: 0, y: 0}, deltasOne)
  await deltasAdd(ctx.redis, challengeNumber, {x: 1, y: 1}, deltasTwo)

  // Ensure the deltas got added to their respective partitions
  await expect(
    deltasGet(ctx.redis, challengeNumber, {x: 0, y: 0}),
  ).resolves.toEqual(deltasOne)
  await expect(
    deltasGet(ctx.redis, challengeNumber, {x: 1, y: 1}),
  ).resolves.toEqual(deltasTwo)

  // Clear the first partition, ensure only that partition is cleared
  await deltasClear(ctx.redis, challengeNumber, {x: 0, y: 0})

  await expect(
    deltasGet(ctx.redis, challengeNumber, {x: 0, y: 0}),
  ).resolves.toEqual([])
  await expect(
    deltasGet(ctx.redis, challengeNumber, {x: 1, y: 1}),
  ).resolves.toEqual(deltasTwo)
})
