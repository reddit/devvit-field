import {expect} from 'vitest'
import {makeRandomSeed} from '../../../shared/save'
import {DevvitTest} from './_utils/DevvitTest'
import {toMatrix} from './_utils/utils'
import {challengeMetaSet} from './challenge'
import {FIELD_CELL_BITS, fieldClaimCells, fieldGet} from './field'

DevvitTest.it('should throw on out of bounds', async ctx => {
  const challengeNumber = 0
  await challengeMetaSet({
    challengeNumber,
    redis: ctx.redis,
    meta: {cols: 2, rows: 2, seed: makeRandomSeed(), density: 0},
  })

  await expect(() =>
    fieldClaimCells({
      coords: [{x: -1, y: 0}],
      challengeNumber,
      redis: ctx.redis,
    }),
  ).rejects.toThrow(/Out of bounds/)

  await expect(() =>
    fieldClaimCells({
      coords: [{x: 2, y: 0}],
      challengeNumber,
      redis: ctx.redis,
    }),
  ).rejects.toThrow(/Out of bounds/)

  await expect(() =>
    fieldClaimCells({
      coords: [{x: 0, y: 2}],
      challengeNumber,
      redis: ctx.redis,
    }),
  ).rejects.toThrow(/Out of bounds/)
})

DevvitTest.it('should claim a cell and return if it was claimed', async ctx => {
  const challengeNumber = 0
  await challengeMetaSet({
    challengeNumber,
    redis: ctx.redis,
    meta: {cols: 2, rows: 2, seed: makeRandomSeed(), density: 0},
  })
  const result = await fieldClaimCells({
    coords: [{x: 1, y: 1}],
    challengeNumber,
    redis: ctx.redis,
  })

  expect(result).toEqual({delta: [{x: 1, y: 1}]})

  expect(
    toMatrix({
      result: await fieldGet({challengeNumber, redis: ctx.redis}),
      cols: 2,
      rows: 2,
      bitsPerCell: FIELD_CELL_BITS,
    }),
  ).toEqual([
    [0, 0],
    [0, 1],
  ])
})

DevvitTest.it('should claim multiple cells', async ctx => {
  const challengeNumber = 0
  await challengeMetaSet({
    challengeNumber,
    redis: ctx.redis,
    meta: {cols: 2, rows: 2, seed: makeRandomSeed(), density: 0},
  })

  const result = await fieldClaimCells({
    coords: [
      {x: 1, y: 1},
      {x: 0, y: 0},
    ],
    challengeNumber,
    redis: ctx.redis,
  })

  expect(result).toEqual({
    delta: [
      {x: 1, y: 1},
      {x: 0, y: 0},
    ],
  })

  expect(
    toMatrix({
      result: await fieldGet({challengeNumber, redis: ctx.redis}),
      cols: 2,
      rows: 2,
      bitsPerCell: FIELD_CELL_BITS,
    }),
  ).toEqual([
    [1, 0],
    [0, 1],
  ])
})

DevvitTest.it('should not return if cell already claimed', async ctx => {
  const challengeNumber = 0
  await challengeMetaSet({
    challengeNumber,
    redis: ctx.redis,
    meta: {cols: 2, rows: 2, seed: makeRandomSeed(), density: 0},
  })

  await fieldClaimCells({
    coords: [{x: 1, y: 1}],
    challengeNumber,
    redis: ctx.redis,
  })

  // Claiming again and deltas should not return anything
  const result = await fieldClaimCells({
    coords: [{x: 1, y: 1}],
    challengeNumber,
    redis: ctx.redis,
  })

  expect(result).toEqual({delta: []})
})
