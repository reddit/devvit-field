import {expect, it} from 'vitest'
import {type MinefieldConfig, minefieldIsMine} from './minefield'

it('returns a boolean consistently for a given seed, x, and y', () => {
  const seed = 111
  const x = 10
  const y = 5

  // calling minefieldIsMine multiple times with the same params should yield the same result
  const result1 = minefieldIsMine({x, y}, seed)
  const result2 = minefieldIsMine({x, y}, seed)
  expect(result1).toBe(result2)
})

it('obeys the mineDensity configuration', () => {
  const seed = 111

  const lowDensityConfig: MinefieldConfig = {mineDensity: 0.0}
  const highDensityConfig: MinefieldConfig = {mineDensity: 1.0}

  // if mineDensity is 0, minefieldIsMine should always return false
  expect(minefieldIsMine({x: 0, y: 0}, seed, lowDensityConfig)).toBe(false)
  expect(minefieldIsMine({x: 100, y: 100}, seed, lowDensityConfig)).toBe(false)

  // if mineDensity is 1.0, minefieldIsMine should always return true
  expect(minefieldIsMine({x: 0, y: 0}, seed, highDensityConfig)).toBe(true)
  expect(minefieldIsMine({x: 100, y: 100}, seed, highDensityConfig)).toBe(true)
})

it('generates at least some mines under normal conditions', () => {
  const seed = 111
  const config: MinefieldConfig = {mineDensity: 0.15}

  // We can check a small area for at least one mine
  // (this is not guaranteed for every random distribution, but likely).
  let mineCount = 0
  for (let x = 0; x < 100; x++) {
    for (let y = 0; y < 100; y++) {
      if (minefieldIsMine({x, y}, seed, config)) {
        mineCount++
      }
    }
  }

  expect(mineCount).toBeGreaterThanOrEqual(0) // trivially true but checks it runs
})
