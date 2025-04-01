import type {Devvit} from '@devvit/public-api'

export type GlobalStats = {
  totalPlayers: number
  totalBans: number
  totalFields: number
}

const getGlobalStatsKey = () => 'global1:stats' as const

export const globalStatsInitialState: GlobalStats = {
  /** How many people have been shown the experience, not how many are active */
  totalPlayers: 0,
  totalBans: 0,
  totalFields: 0,
}

export const globalStatsGet = async ({
  redis,
}: {
  redis: Devvit.Context['redis']
}): Promise<GlobalStats> => {
  const stats = await redis.global.hGetAll(getGlobalStatsKey())

  return {...globalStatsInitialState, ...deserializeStats(stats)}
}

export const globalStatsIncrement = async ({
  redis,
  field: key,
  incrementBy = 1,
}: {
  redis: Devvit.Context['redis']
  field: keyof GlobalStats
  incrementBy?: number
}): Promise<void> => {
  await redis.global.hIncrBy(getGlobalStatsKey(), key, incrementBy)
}

// Helper function to serialize numbers to strings for Redis
// const serializeStats = (stats: GlobalStats): Record<string, string> => {
//   return Object.fromEntries(
//     Object.entries(stats).map(([key, value]) => [key, value.toString()]),
//   )
// }

// Helper function to deserialize strings back to numbers
const deserializeStats = (data: Record<string, string>): GlobalStats => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, parseInt(value, 10)]),
  ) as GlobalStats
}
