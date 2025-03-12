import {
  Devvit,
  type JSONObject,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {GLOBAL_REALTIME_CHANNEL} from '../../../shared/const'
import type {
  LeaderboardUpdate,
  TeamBoxCounts,
} from '../../../shared/types/message'
import {activePlayersGet} from '../core/activePlayers'
import {challengeMaybeGetCurrentChallengeNumber} from '../core/challenge'
import {teamStatsCellsClaimedGetTotal} from '../core/leaderboards/challenge/team.cellsClaimed.ts'
import {teamStatsMinesHitGet} from '../core/leaderboards/challenge/team.minesHit'

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

  const [leaderboard, banned, activePlayers] = await Promise.all([
    teamStatsCellsClaimedGetTotal(ctx.redis, currentChallengeNumber, 'DESC'),
    teamStatsMinesHitGet({
      challengeNumber: currentChallengeNumber,
      redis: ctx.redis,
      sort: 'DESC',
    }),
    activePlayersGet({redis: ctx.redis}),
  ])

  const teamBoxCounts = [0, 0, 0, 0] as TeamBoxCounts
  for (const team of leaderboard) {
    teamBoxCounts[team.member] = team.score
  }
  const message: LeaderboardUpdate = {
    type: 'LeaderboardUpdate',
    teamBoxCounts,
    bannedPlayers: banned.reduce((acc, x) => acc + x.score, 0),
    activePlayers,
  }

  await ctx.realtime.send(GLOBAL_REALTIME_CHANNEL, message)
}

Devvit.addSchedulerJob({
  name: 'LEADERBOARD_UPDATE',
  onRun,
})
