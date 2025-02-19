import type {Devvit} from '@devvit/public-api'
import type {Delta} from '../../../shared/types/field'

const getChallengeDeltasKey = (challengeNumber: number) =>
  `challenge:${challengeNumber}:deltas` as const

export const deltasGet = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<Delta[]> => {
  const deltas = await redis.zRange(
    getChallengeDeltasKey(challengeNumber),
    0,
    -1,
  )

  return deltas.map(x => JSON.parse(x.member))
}

export const deltasAdd = async ({
  redis,
  challengeNumber,
  deltas,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  deltas: Delta[]
}): Promise<void> => {
  if (deltas.length === 0) return

  await redis.zAdd(
    getChallengeDeltasKey(challengeNumber),
    // TODO: Maybe we just stringify the whole object and this is a snapshot? Otherwise there's
    // a lot of stringify and parse which could get expensive
    ...deltas.map(x => ({
      score: Date.now(),
      member: JSON.stringify(x),
    })),
  )
}

export const deltasClear = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<void> => {
  // TODO: Would deleting the key be faster?
  await redis.zRemRangeByRank(getChallengeDeltasKey(challengeNumber), 0, -1)
}
