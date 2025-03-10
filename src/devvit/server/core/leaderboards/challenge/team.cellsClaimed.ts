import type {Devvit} from '@devvit/public-api'
import {
  type Layout,
  makePartitionKey,
  partitionXYs,
} from '../../../../../shared/partition'
import type {Team} from '../../../../../shared/team'
import type {XY} from '../../../../../shared/types/2d'
import {parseTeam} from './team'

const getRedisKey = (challengeNumber: number) =>
  `challenge:${challengeNumber}:stats:team:cells_claimed` as const

const getPartitionRedisKey = (challengeNumber: number, partitionXY: XY) =>
  `challenge:${challengeNumber}:stats:team:cells_claimed:${makePartitionKey(partitionXY)}` as const

const getPartitionRedisVersionKey = (
  challengeNumber: number,
  partitionXY: XY,
  sequenceNumber: number,
) =>
  `{${getPartitionRedisKey(challengeNumber, partitionXY)}}:${sequenceNumber}` as const

export async function teamStatsCellsClaimedGet(
  redis: Devvit.Context['redis'],
  layout: Layout,
  challengeNumber: number,
  sort: 'ASC' | 'DESC' = 'DESC',
): Promise<
  {
    member: Team
    score: number
  }[]
> {
  const promises: Promise<{member: Team; score: number}[]>[] = []
  for (const partitionXY of partitionXYs(layout)) {
    promises.push(
      teamStatsCellsClaimedGetPartitioned(
        redis,
        challengeNumber,
        partitionXY,
        sort,
      ),
    )
  }
  const sum = new Map<Team, number>()
  for (const result of await Promise.all(promises)) {
    for (const entry of result) {
      sum.set(entry.member, (sum.get(entry.member) ?? 0) + entry.score)
    }
  }

  const results: {member: Team; score: number}[] = []
  for (const [team, score] of sum.entries()) {
    results.push({member: team, score})
  }
  return results
}

export async function teamStatsCellsClaimedGetPartitioned(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
  sort: 'ASC' | 'DESC' = 'DESC',
): Promise<
  {
    member: Team
    score: number
  }[]
> {
  const result = await redis.zRange(
    getPartitionRedisKey(challengeNumber, partitionXY),
    0,
    -1,
    {
      by: 'rank',
      reverse: sort === 'DESC',
    },
  )

  return result.map(({member: memberString, score}) => {
    const member = parseTeam(memberString)
    return {
      member,
      score,
    }
  })
}

export async function teamStatsCellsClaimedGetTotal(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  sort: 'ASC' | 'DESC' = 'DESC',
): Promise<
  {
    member: Team
    score: number
  }[]
> {
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

export async function teamStatsCellsClaimedIncrementForMemberPartitioned(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
  member: Team,
  incrementBy: number = 1,
): Promise<void> {
  await redis.zIncrBy(
    getPartitionRedisKey(challengeNumber, partitionXY),
    member.toString(),
    incrementBy,
  )
}

export async function teamStatsCellsClaimedIncrementForMemberTotal(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  member: Team,
  incrementBy: number = 1,
): Promise<void> {
  await redis.zIncrBy(
    getRedisKey(challengeNumber),
    member.toString(),
    incrementBy,
  )
}

export async function teamStatsCellsClaimedForTeamPartitioned(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
  team: Team,
): Promise<number> {
  const result = await redis.zScore(
    getPartitionRedisKey(challengeNumber, partitionXY),
    team.toString(),
  )
  return result === undefined ? 0 : result
}

/**
 * Renames a partitioned set of teams data to be queued up for processing.
 * Old key:
 *  challenge:${challengeNumber}:stats:team:cells_claimed:{px_${p.x}__py_${p.y}}
 * New key:
 *  challenge:${challengeNumber}:deltas_to_process:seq_${seqNo}:{px_${p.x}__py_${p.y}}
 * @param redis
 * @param challengeNumber
 * @param sequenceNumber
 * @param partitionXY
 */
export async function teamStatsCellsClaimedRotate(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  sequenceNumber: number,
  partitionXY: XY,
): Promise<void> {
  const accumKey = getPartitionRedisKey(challengeNumber, partitionXY)
  const snapshotKey = getPartitionRedisVersionKey(
    challengeNumber,
    partitionXY,
    sequenceNumber,
  )
  try {
    await redis.rename(accumKey, snapshotKey)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERR no such key')) {
      return
    }
    throw error
  }

  // Update global stats.
  const globalKey = getRedisKey(challengeNumber)
  const members = await redis.zRange(snapshotKey, 0, -1)
  await redis.zAdd(globalKey, ...members)
}

export async function teamStatsCellsClaimedGetPartitionedAndVersioned(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
  sequenceNumber: number,
  sort: 'ASC' | 'DESC' = 'DESC',
): Promise<
  {
    member: Team
    score: number
  }[]
> {
  const result = await redis.zRange(
    getPartitionRedisVersionKey(challengeNumber, partitionXY, sequenceNumber),
    0,
    -1,
    {
      by: 'rank',
      reverse: sort === 'DESC',
    },
  )

  return result.map(({member: memberString, score}) => {
    const member = parseTeam(memberString)
    return {
      member,
      score,
    }
  })
}
