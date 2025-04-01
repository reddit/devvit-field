// TODO: Write algorithm for scoring and ending the game

import type {ZMember} from '@devvit/protos'
import type {Devvit, JobContext} from '@devvit/public-api'
import {makePartitionKey, partitionXYs} from '../../../shared/partition.js'
import type {Team} from '../../../shared/team'
import type {XY} from '../../../shared/types/2d.js'
import {challengeConfigGet} from './challenge.ts'

const scorePerPartitionKey = (challengeNumber: number, partitionXY: XY) =>
  `score:${challengeNumber}:partition:${makePartitionKey(partitionXY)}`

export type ComputeScoreResponse = {
  /** Is the game over */
  isOver: boolean
  /** The team that win */
  winner?: Team | undefined
  /** The remaining % of the grid (0 - 100) */
  remainingPercentage: number
  /** Used for guidance in autoscaling of next round */
  claimsPerSecond: number
}

export const computeScore = ({
  size,
  teams,
  startTimeMs,
}: {
  /** Size of the grid */
  size: number
  /** Teams playing */
  teams: {member: Team; score: number}[]
  startTimeMs: number
}): ComputeScoreResponse => {
  const area = size * size

  const claimedSquares = teams.reduce((acc, {score}) => acc + score, 0)
  const remainingSquares = area - claimedSquares

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score)
  const topTeam = sortedTeams[0]
  const secondTeam = sortedTeams[1]

  if (!topTeam || !secondTeam)
    throw new Error('There must be at least two teams to score the game')

  // Calculate the difference between the top team and second team
  const difference = topTeam.score - (secondTeam?.score ?? 0)

  // The game is over if:
  // - The top team cannot be caught: difference > remainingSquares
  // - OR there are no squares left to claim
  const isOver = difference > remainingSquares || remainingSquares === 0

  // TODO Handle the tie case?
  // if(difference === 0 && remainingSquares === 0) {
  // }

  const durationSeconds = Math.min(30, (Date.now() - startTimeMs) / 1_000)
  return {
    isOver,
    winner: isOver ? topTeam.member : undefined,
    remainingPercentage: Math.round((remainingSquares / area) * 100),
    claimsPerSecond: claimedSquares / durationSeconds,
  }
}

export async function updatePartitionScore(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
  teams: ZMember[],
): Promise<void> {
  await redis.zAdd(scorePerPartitionKey(challengeNumber, partitionXY), ...teams)
}

export async function computePreciseScore(
  ctx: JobContext,
  challengeNumber: number,
  startTimeMs: number,
): Promise<ComputeScoreResponse & {teams: {member: Team; score: number}[]}> {
  const config = await challengeConfigGet({
    challengeNumber: challengeNumber,
    subredditId: ctx.subredditId,
    redis: ctx.redis,
  })
  const ps: Promise<ZMember[]>[] = []
  for (const partitionXY of partitionXYs(config)) {
    ps.push(
      ctx.redis.zRange(
        scorePerPartitionKey(challengeNumber, partitionXY),
        0,
        -1,
      ),
    )
  }

  let totalClaims = 0
  const claims = new Array<number>(4)
  for (const members of await Promise.all(ps)) {
    for (const elem of members) {
      totalClaims += elem.score
      const team = parseInt(elem.member)
      if (team < 0 || team >= 4) continue
      claims[team] = (claims[team] ?? 0) + elem.score
    }
  }

  const entries = claims.map((score, idx) => [idx, score])
  let topTeam: {member: Team; score: number} | undefined
  let secondTeam: {member: Team; score: number} | undefined
  if (entries.length > 0) {
    entries.sort((a, b) => b[1]! - a[1]!)
    topTeam = {member: entries[0]![0]! as Team, score: entries[0]![1]!}
    if (entries.length > 1) {
      secondTeam = {member: entries[1]![0]! as Team, score: entries[1]![1]!}
    }
  }
  if (!topTeam || !secondTeam)
    throw new Error('There must be at least two teams to score the game')

  // Calculate the difference between the top team and second team
  const difference = topTeam.score - secondTeam.score

  // The game is over if:
  // - The top team cannot be caught: difference > remainingSquares
  // - OR there are no squares left to claim
  const area = config.size * config.size
  const remainingSquares = area - totalClaims
  const isOver = difference > remainingSquares || remainingSquares === 0

  return {
    isOver,
    winner: isOver ? topTeam.member : undefined,
    remainingPercentage: Math.round((remainingSquares / area) * 100),
    claimsPerSecond: totalClaims / ((Date.now() - startTimeMs) / 1_000),
    teams: claims.map((score, idx) => ({member: idx as Team, score})),
  }
}
