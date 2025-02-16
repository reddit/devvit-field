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
