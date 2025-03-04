import type {XY} from '../../../shared/types/2d'
import {Random, type Seed} from '../../../shared/types/random'

export interface MinefieldConfig {
  /**
   * Integer between 0 and 100.
   *
   * 0: No mines
   * 100: Only mines
   */
  mineDensity: number
}

const DEFAULT_CONFIG: MinefieldConfig = {
  mineDensity: 2,
}

export function minefieldIsMine({
  seed,
  coord,
  cols,
  config = DEFAULT_CONFIG,
}: {
  seed: Seed
  coord: XY
  cols: number
  config?: MinefieldConfig
}): boolean {
  if (
    !Number.isInteger(config.mineDensity) ||
    config.mineDensity < 0 ||
    config.mineDensity > 100
  ) {
    throw new Error(
      `mineDensity must be an integer between 0-100, got ${config.mineDensity}`,
    )
  }

  const rnd = new Random(createSeedFromCoords(seed, coord, cols))

  return rnd.num < config.mineDensity / 100
}

function createSeedFromCoords(seed: Seed, coord: XY, cols: number): Seed {
  return Math.trunc(seed + coord.y * cols + coord.x) as Seed
}

/**
 * Goes through an entire minefield and counts the number of mines. Since we use
 * a seed based RND we need to walk the entire field to get the total number of
 * mines.
 */
export function minefieldGetTotalMineCount({
  seed,
  cols,
  rows,
  config = DEFAULT_CONFIG,
}: {
  seed: Seed
  cols: number
  rows: number
  config?: MinefieldConfig
}): number {
  let total = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (minefieldIsMine({seed, coord: {x, y}, cols, config})) {
        total++
      }
    }
  }
  return total
}
