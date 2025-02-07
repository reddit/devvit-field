import type {XY} from '../../../shared/types/2d'
import {Random, type Seed} from '../../../shared/types/random'

export interface MinefieldConfig {
  mineDensity: number // Probability (0.0 to 1.0)
}

const DEFAULT_CONFIG: MinefieldConfig = {
  mineDensity: 0.02,
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
  const rnd = new Random(createSeedFromCoords(seed, coord, cols))

  return rnd.num() < config.mineDensity
}

function createSeedFromCoords(seed: Seed, coord: XY, cols: number): Seed {
  return Math.trunc(seed + coord.y * cols + coord.x) as Seed
}
