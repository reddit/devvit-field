import type {Devvit, TxClientLike} from '@devvit/public-api'
import type {Team} from '../../../shared/team'

export type ChallengeStats = {
  [key in `team:${Team}:cellsClaimed`]: number
} & {
  [key in `team:${Team}:minesHit`]: number
} & {
  totalMinesHit: number
  totalCellsClaimed: number
}

const getChallengeStatsKey = (challengeNumber: number) =>
  `challenge:${challengeNumber}:stats` as const

export const challengeStatsInitialState: ChallengeStats = {
  'team:0:cellsClaimed': 0,
  'team:0:minesHit': 0,
  'team:1:cellsClaimed': 0,
  'team:1:minesHit': 0,
  'team:2:cellsClaimed': 0,
  'team:2:minesHit': 0,
  'team:3:cellsClaimed': 0,
  'team:3:minesHit': 0,
  totalMinesHit: 0,
  totalCellsClaimed: 0,
}

export const challengeStatsGet = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<ChallengeStats> => {
  const stats = await redis.hGetAll(getChallengeStatsKey(challengeNumber))
  if (!stats) throw Error(`no stats for ${challengeNumber}`)

  return deserializeStats(stats)
}

export const challengeStatsIncrement = async ({
  redis,
  challengeNumber,
  field: key,
  incrementBy = 1,
}: {
  redis: Devvit.Context['redis'] | TxClientLike
  challengeNumber: number
  field: keyof ChallengeStats
  incrementBy?: number
}): Promise<void> => {
  await redis.hIncrBy(getChallengeStatsKey(challengeNumber), key, incrementBy)
}

export const challengeStatsInit = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<void> => {
  await redis.hSet(
    getChallengeStatsKey(challengeNumber),
    serializeStats(challengeStatsInitialState),
  )
}

// Helper function to serialize numbers to strings for Redis
const serializeStats = (stats: ChallengeStats): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [key, value.toString()]),
  )
}

// Helper function to deserialize strings back to numbers
const deserializeStats = (data: Record<string, string>): ChallengeStats => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, parseInt(value, 10)]),
  ) as ChallengeStats
}
