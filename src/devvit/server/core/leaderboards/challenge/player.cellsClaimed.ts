import type {Devvit} from '@devvit/public-api'
import type {T2} from '../../../../../shared/types/tid'

const getRedisKey = (challengeNumber: number) =>
  `challenge:${challengeNumber}:stats:player:cells_claimed` as const

export const playerStatsCellsClaimedGet = async ({
  redis,
  challengeNumber,
  sort = 'DESC',
  limit = 10,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  sort?: 'ASC' | 'DESC'
  limit?: number
}): Promise<
  {
    member: T2
    score: number
  }[]
> => {
  return (await redis.zRange(getRedisKey(challengeNumber), 0, limit, {
    by: 'rank',
    reverse: sort === 'DESC',
  })) as {
    member: T2
    score: number
  }[]
}

export const playerStatsCellsClaimedIncrementForMember = async ({
  redis,
  challengeNumber,
  member,
  incrementBy = 1,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  member: T2
  incrementBy?: number
}): Promise<void> => {
  await redis.zIncrBy(
    getRedisKey(challengeNumber),
    member.toString(),
    incrementBy,
  )
}
