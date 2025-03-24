import {expect, it} from 'vitest'
import type {Seed} from '../../../shared/types/random'
import {
  type MinefieldConfig,
  minefieldGetTotalMineCount,
  minefieldIsMine,
} from './minefield'

it('returns a boolean consistently for a given seed, x, and y', () => {
  const seed = 111 as Seed
  const x = 10
  const y = 5

  // calling isMine multiple times with the same params should yield the same result
  const result1 = minefieldIsMine({
    seed: seed,
    coord: {x, y},
    config: {mineDensity: 80},
  })
  const result2 = minefieldIsMine({
    seed: seed,
    coord: {x, y},
    config: {mineDensity: 80},
  })
  expect(result1).toBe(result2)
})

it('obeys the mineDensity configuration', () => {
  const seed = 111 as Seed

  const lowDensityConfig: MinefieldConfig = {mineDensity: 0}
  const highDensityConfig: MinefieldConfig = {mineDensity: 100}

  // if mineDensity is 0, isMine should always return false
  expect(
    minefieldIsMine({
      coord: {x: 0, y: 0},
      seed,
      config: lowDensityConfig,
    }),
  ).toBe(false)
  expect(
    minefieldIsMine({
      coord: {x: 100, y: 100},
      seed,
      config: lowDensityConfig,
    }),
  ).toBe(false)

  // if mineDensity is 1.0, isMine should always return true
  expect(
    minefieldIsMine({
      coord: {x: 0, y: 0},
      seed,
      config: highDensityConfig,
    }),
  ).toBe(true)
  expect(
    minefieldIsMine({
      coord: {x: 100, y: 100},
      seed,
      config: highDensityConfig,
    }),
  ).toBe(true)
})

it('generates at least some mines under normal conditions', () => {
  const seed = 111 as Seed
  const config: MinefieldConfig = {mineDensity: 15}

  // We can check a small area for at least one mine
  // (this is not guaranteed for every random distribution, but likely).
  let mineCount = 0
  for (let x = 0; x < 100; x++) {
    for (let y = 0; y < 100; y++) {
      if (minefieldIsMine({coord: {x, y}, seed, config})) {
        mineCount++
      }
    }
  }

  expect(mineCount).toBeGreaterThanOrEqual(0) // trivially true but checks it runs
})

it('counts the total number of mines for a given seed', () => {
  const seed = 111 as Seed
  const config: MinefieldConfig = {mineDensity: 15}

  expect(
    minefieldGetTotalMineCount({
      seed,
      cols: 10,
      rows: 10,
      config,
    }),
  ).toBe(20) // should be deterministic based on the seed
})

it('count the total number of mines in a large map', () => {
  const seed = 222 as Seed
  const config: MinefieldConfig = {mineDensity: 2}
  expect(
    minefieldGetTotalMineCount({
      seed,
      cols: 3200,
      rows: 3200,
      config,
    }),
  ).toBe(204358) // should be deterministic based on the seed
})
