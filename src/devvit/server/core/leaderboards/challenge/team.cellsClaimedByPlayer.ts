import type {Devvit} from '@devvit/public-api'
import {type Team, getTeamFromUserId} from '../../../../../shared/team'
import type {T2} from '../../../../../shared/types/tid'

const getRedisKey = (challengeNumber: number, team: Team) =>
  `challenge:${challengeNumber}:stats:team:${team}:cells_claimed` as const

export const teamStatsByPlayerCellsClaimedGet = async ({
  redis,
  challengeNumber,
  sort = 'DESC',
  limit = 10,
  team,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  sort?: 'ASC' | 'DESC'
  limit?: number
  team: Team
}): Promise<
  {
    member: T2
    score: number
  }[]
> => {
  return (await redis.zRange(getRedisKey(challengeNumber, team), 0, limit, {
    by: 'rank',
    reverse: sort === 'DESC',
  })) as {
    member: T2
    score: number
  }[]
}

export const teamStatsByPlayerCellsClaimedIncrementForMember = async ({
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
    getRedisKey(challengeNumber, getTeamFromUserId(member)),
    member.toString(),
    incrementBy,
  )
}

export const teamStatsByPlayerCellsClaimedGameOver = async ({
  redis,
  challengeNumber,
  member,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  member: T2
}): Promise<void> => {
  await redis.zRem(getRedisKey(challengeNumber, getTeamFromUserId(member)), [
    member,
  ])
}

export const teamStatsByPlayerCellsClaimedForMember = async ({
  redis,
  challengeNumber,
  member,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  member: T2
}): Promise<number | undefined> => {
  const result = await redis.zScore(
    getRedisKey(challengeNumber, getTeamFromUserId(member)),
    member,
  )
  return result
}
