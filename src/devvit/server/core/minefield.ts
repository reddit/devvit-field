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

type MineCacheEntry = {
  records: Map<string, boolean>
  lastUsedTimeMs: number
}

const mineCache: Map<string, MineCacheEntry> = new Map()

function mineCacheKey(key: {seed: Seed; density: number; coord: XY}): string {
  return `${key.seed}:${key.density}`
}

function mineCacheKey2(key: {seed: Seed; density: number; coord: XY}): string {
  return `${key.seed}:${key.density}:${key.coord.x},${key.coord.y}`
}

function checkMineCache(key: {seed: Seed; density: number; coord: XY}):
  | boolean
  | undefined {
  const entry = mineCache.get(mineCacheKey(key))
  if (!entry) return undefined
  entry.lastUsedTimeMs = Date.now()
  return entry.records.get(mineCacheKey2(key))
}

function setMineCache(
  key: {seed: Seed; density: number; coord: XY},
  isMine: boolean,
): void {
  const k = mineCacheKey(key)
  let entry = mineCache.get(k)
  if (!entry) {
    entry = {
      records: new Map(),
      lastUsedTimeMs: Date.now(),
    }
    mineCache.set(k, entry)
  }
  entry.records.set(mineCacheKey2(key), isMine)

  // Delete any stale caches.
  const toRemove: string[] = []
  const threshold = Date.now() - 60_000
  for (const [k, entry] of mineCache.entries()) {
    if (entry.lastUsedTimeMs < threshold) {
      toRemove.push(k)
    }
  }
  for (const k of toRemove) {
    mineCache.delete(k)
  }
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

  const cached = checkMineCache({seed, coord, density: config.mineDensity})
  if (cached !== undefined) {
    return cached
  }

  // Use SHA-256 to consistently sample a point by coordinate and produce a
  // random outcome that is relatively isolated from its position in space.
  // biome-ignore lint/security/noGlobalEval:
  const crypto = eval(`require('node:crypto')`)
  const hash = crypto.createHash('md5')
  hash.update(`${seed}:${coord.x},${coord.y}`)
  const digest = hash.digest()

  // Convert first 4 bytes of digest to a random u32 in interval [0, 2^32).
  let value = 0n
  for (let i = 0; i < 4; i++) {
    value = (value << 8n) | BigInt(digest[i])
  }

  // Scale up mine density by 2^32/100.
  const density = (BigInt(config.mineDensity) * 4294967296n) / 100n
  setMineCache({seed, coord, density: config.mineDensity}, value < density)
  return value < density
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
