import type {Devvit} from '@devvit/public-api'

export type GlobalStats = {
  totalPlayers: number
}

const getGlobalStatsKey = (globalNumber: number) =>
  `global:${globalNumber}:stats` as const

export const globalStatsInitialState: GlobalStats = {
  /** How many people have been shown the experience, not how many are active */
  totalPlayers: 0,
}

export const globalStatsGet = async ({
  redis,
  globalNumber,
}: {
  redis: Devvit.Context['redis']
  globalNumber: number
}): Promise<GlobalStats> => {
  const stats = await redis.global.hGetAll(getGlobalStatsKey(globalNumber))
  if (Object.keys(stats).length === 0)
    throw Error(`no stats for ${globalNumber}`)

  return deserializeStats(stats)
}

export const globalStatsIncrement = async ({
  redis,
  globalNumber,
  field: key,
  incrementBy = 1,
}: {
  redis: Devvit.Context['redis']
  globalNumber: number
  field: keyof GlobalStats
  incrementBy?: number
}): Promise<void> => {
  await redis.global.hIncrBy(getGlobalStatsKey(globalNumber), key, incrementBy)
}

export const globalStatsInit = async ({
  redis,
  globalNumber,
}: {
  redis: Devvit.Context['redis']
  globalNumber: number
}): Promise<void> => {
  const stats = await redis.global.hGetAll(getGlobalStatsKey(globalNumber))

  if (Object.keys(stats).length === 0) {
    await redis.global.hSet(
      getGlobalStatsKey(globalNumber),
      serializeStats(globalStatsInitialState),
    )
  }
}

// Helper function to serialize numbers to strings for Redis
const serializeStats = (stats: GlobalStats): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [key, value.toString()]),
  )
}

// Helper function to deserialize strings back to numbers
const deserializeStats = (data: Record<string, string>): GlobalStats => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, parseInt(value, 10)]),
  ) as GlobalStats
}
