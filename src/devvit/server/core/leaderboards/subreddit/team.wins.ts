// TODO: Delete? Haven't seen this in latest comps
import type {Devvit} from '@devvit/public-api'
import {type Team, teams} from '../../../../../shared/team'

const getRedisKey = () => 'stats:team:wins' as const

export const teamStatsWinsGet = async ({
  redis,
  sort = 'DESC',
}: {
  redis: Devvit.Context['redis']
  sort?: 'ASC' | 'DESC'
}): Promise<
  {
    member: Team
    score: number
  }[]
> => {
  const result = await redis.zRange(getRedisKey(), 0, -1, {
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

export const teamStatsWinsIncrementForMember = async ({
  redis,
  member,
  incrementBy = 1,
}: {
  redis: Devvit.Context['redis']
  member: Team
  incrementBy?: number
}): Promise<void> => {
  await redis.zIncrBy(getRedisKey(), member.toString(), incrementBy)
}

/**
 * Initializes all teams in the sorted set. Since we do math on them, this is a safety measure
 * and happens at the creation of each challenge.
 */
export const teamStatsWinsInit = async ({
  redis,
}: {
  redis: Devvit.Context['redis']
}): Promise<void> => {
  const teamsLength = await redis.zCard(getRedisKey())
  if (teamsLength > 0) return

  await redis.zAdd(
    getRedisKey(),
    ...teams.map(team => ({member: team.toString(), score: 0})),
  )
}
