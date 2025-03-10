import type {Devvit} from '@devvit/public-api'
import {type Team, teams} from '../../../../../shared/team'
import {parseTeam} from './team'

const getRedisKey = (challengeNumber: number) =>
  `challenge:${challengeNumber}:stats:team:mines_hit` as const

export const teamStatsMinesHitGet = async ({
  redis,
  challengeNumber,
  sort = 'DESC',
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  sort?: 'ASC' | 'DESC'
}): Promise<
  {
    member: Team
    score: number
  }[]
> => {
  const result = await redis.zRange(getRedisKey(challengeNumber), 0, -1, {
    by: 'rank',
    reverse: sort === 'DESC',
  })

  return result.map(({member: memberString, score}) => {
    const member = parseTeam(memberString)
    return {
      member,
      score,
    }
  })
}

export const teamStatsMinesHitIncrementForMember = async ({
  redis,
  challengeNumber,
  member,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  member: Team
}): Promise<void> => {
  await redis.zIncrBy(getRedisKey(challengeNumber), member.toString(), 1)
}

/**
 * Initializes all teams in the sorted set. Since we do math on them, this is a safety measure
 * and happens at the creation of each challenge.
 */
export const teamStatsMinesHitInit = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<void> => {
  const teamsLength = await redis.zCard(getRedisKey(challengeNumber))
  if (teamsLength > 0) return

  await redis.zAdd(
    getRedisKey(challengeNumber),
    ...teams.map(team => ({member: team.toString(), score: 0})),
  )
}

export const teamStatsMinesHitForTeam = async ({
  redis,
  challengeNumber,
  team,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  team: Team
}): Promise<number> => {
  const result = await redis.zScore(
    getRedisKey(challengeNumber),
    team.toString(),
  )
  return result === undefined ? 0 : result
}
