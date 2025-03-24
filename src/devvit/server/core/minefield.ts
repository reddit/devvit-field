import type {XY} from '../../../shared/types/2d'
import type {Seed} from '../../../shared/types/random'

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
  config = DEFAULT_CONFIG,
}: {
  seed: Seed
  coord: XY
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

  // Use hash function to consistently sample a point by coordinate and produce
  // a random outcome that is relatively isolated from its position in space.
  const hashKey = `${coord.x},${coord.y},${seed}`
  const hashValue = hashU32(hashKey)

  // Scale up mine density by 2^32/100.
  const density = (BigInt(config.mineDensity) * 4294967296n) / 100n

  return hashValue < density
}

function hashU32(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // Convert to i32
  }

  // Convert i32 to u32
  return hash >>> 0
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
      if (minefieldIsMine({seed, coord: {x, y}, config})) {
        total++
      }
    }
  }
  return total
}
