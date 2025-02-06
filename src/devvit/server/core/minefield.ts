import type {XY} from '../../../shared/types/2d'

/**
 * A small interface to configure the density (probability) of mines.
 */
export interface MinefieldConfig {
  mineDensity: number // Probability (0.0 to 1.0)
}

const DEFAULT_CONFIG: MinefieldConfig = {
  mineDensity: 0.15,
}

/**
 * FNV-1a 32-bit hash function
 * @param str A string to hash
 * @returns A 32-bit integer
 */
function fnv1a32(str: string): number {
  let hash = 0x811c9dc5 // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    // multiply by prime mod 2^32
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0 // ensure unsigned 32-bit
}

/**
 * Given (x, y, seed, config) return whether that coordinate is a mine.
 * @param x The x-coordinate
 * @param y The y-coordinate
 * @param seed A seed string that ensures deterministic random distribution
 * @param config (optional) configure the density of mines, defaults to 0.15
 * @returns boolean - true if the cell is a mine
 */
export function minefieldIsMine(
  coord: XY,
  seed: number,
  config: MinefieldConfig = DEFAULT_CONFIG,
): boolean {
  // create a unique string based on x, y, and seed
  const combined = `${seed}-${coord.x}-${coord.y}`
  // hash to a 32-bit integer
  const hashValue = fnv1a32(combined)
  // convert to fraction in [0, 1)
  const fraction = hashValue / 0xffffffff
  // compare with the configured mine density
  return fraction < config.mineDensity
}
