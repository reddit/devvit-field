import {
  Devvit,
  type JSONObject,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const'
import type {Team} from '../../../shared/team.js'
import type {
  LeaderboardUpdate,
  TeamBoxCounts,
} from '../../../shared/types/message'
import {activePlayersGet} from '../core/activePlayers'
import {
  challengeConfigGet,
  challengeMaybeGetCurrentChallengeNumber,
} from '../core/challenge'
import {fieldEndGame} from '../core/field.ts'
import {teamStatsCellsClaimedGetTotal} from '../core/leaderboards/challenge/team.cellsClaimed.ts'
import {teamStatsMinesHitGet} from '../core/leaderboards/challenge/team.minesHit'
import {computeScore} from '../core/score.ts'

/**
 * This is just a stub for the interface that we need on the client to satisfy the UI
 * requirements. Feel free to change to anything else!
 */
export const onRun: ScheduledJobHandler<JSONObject | undefined> = async (
  _,
  ctx,
): Promise<void> => {
  const currentChallengeNumber = await challengeMaybeGetCurrentChallengeNumber({
    redis: ctx.redis,
  })
  if (!currentChallengeNumber) return

  const config = await challengeConfigGet({
    challengeNumber: currentChallengeNumber,
    subredditId: ctx.subredditId,
    redis: ctx.redis,
  })
  if (!config) return

  const [leaderboard, banned, activePlayers] = await Promise.all([
    teamStatsCellsClaimedGetTotal(ctx.redis, currentChallengeNumber, 'DESC'),
    teamStatsMinesHitGet({
      challengeNumber: currentChallengeNumber,
      redis: ctx.redis,
      sort: 'DESC',
    }),
    activePlayersGet({redis: ctx.redis}),
  ])

  // Zeroes from Redis aren't necessarily initialized. Set them here to
  // ensure we score all teams.
  const teams: {member: Team; score: number}[] = [
    {member: 0, score: 0},
    {member: 1, score: 0},
    {member: 2, score: 0},
    {member: 3, score: 0},
  ]
  for (const team of leaderboard) {
    teams[team.member]!.score = team.score
  }

  // Whether or not the challenge is over determines what event we emit
  const score = computeScore({size: config.size, teams})
  if (score.isOver) {
    // Fire a challenge complete event and start the new challenge!
    await fieldEndGame(ctx, currentChallengeNumber, teams)
  } else {
    const message: LeaderboardUpdate = {
      type: 'LeaderboardUpdate',
      teamBoxCounts: teams.map(x => x.score) as TeamBoxCounts,
      bannedPlayers: banned.reduce((acc, x) => acc + x.score, 0),
      activePlayers,
    }
    await ctx.realtime.send(INSTALL_REALTIME_CHANNEL, message)
  }
}

Devvit.addSchedulerJob({
  name: 'LEADERBOARD_UPDATE',
  onRun,
})
