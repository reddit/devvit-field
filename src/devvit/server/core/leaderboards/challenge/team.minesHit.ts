import type {Devvit} from '@devvit/public-api'
import {type Team, teams} from '../../../../../shared/team'

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
    const member = parseInt(memberString, 10) as Team

    if (Number.isNaN(member)) {
      throw Error(`invalid member: ${member}. Members must be a valid number!`)
    }

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
  incrementBy = 1,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  member: Team
  incrementBy?: number
}): Promise<void> => {
  await redis.zIncrBy(
    getRedisKey(challengeNumber),
    member.toString(),
    incrementBy,
  )
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
