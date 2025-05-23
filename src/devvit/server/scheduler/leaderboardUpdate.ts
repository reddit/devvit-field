import {gauge} from '@devvit/metrics'
import {
  Devvit,
  type JSONObject,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const'
import {fillAndSortByTeamNumber, teamPascalCase} from '../../../shared/team.js'
import {currentChallengeStartTimeMillisKey} from '../../../shared/types/challenge-config.js'
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
import {leaderboardGet} from '../core/leaderboards/global/leaderboard.ts'
import {computeScore} from '../core/score.ts'

const metrics = {
  bannedPlayers: gauge({
    name: 'banned_players',
    labels: ['team'],
  }),

  score: gauge({
    name: 'score',
    labels: ['team'],
  }),
}

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

  const [challengeLeaderboard, banned, activePlayers, globalStandings] =
    await Promise.all([
      teamStatsCellsClaimedGetTotal(ctx.redis, currentChallengeNumber, 'DESC'),
      teamStatsMinesHitGet({
        challengeNumber: currentChallengeNumber,
        redis: ctx.redis,
        sort: 'DESC',
      }),
      activePlayersGet({redis: ctx.redis}),
      leaderboardGet({redis: ctx.redis, sort: 'DESC'}),
    ])

  const bannedPlayers = banned.reduce((acc, x) => acc + x.score, 0)
  for (const team of banned) {
    metrics.bannedPlayers.labels(teamPascalCase[team.member]).set(team.score)
  }

  // Zeroes from Redis aren't necessarily initialized. Set them here to
  // ensure we score all teams.
  const challengeLeaderboardTeams =
    fillAndSortByTeamNumber(challengeLeaderboard)

  for (const team of challengeLeaderboardTeams) {
    metrics.score.labels(teamPascalCase[team.member]).set(team.score)
  }

  let startTimeMs = 0
  const startedStr = await ctx.redis.get(currentChallengeStartTimeMillisKey)
  if (startedStr) startTimeMs = parseFloat(startedStr) || 0

  // Whether or not the challenge is over determines what event we emit
  const score = computeScore({
    size: config.size,
    teams: challengeLeaderboardTeams,
    startTimeMs,
  })
  if (score.isOver) {
    // Fire a challenge complete event and start the new challenge!
    await fieldEndGame(
      ctx,
      currentChallengeNumber,
      challengeLeaderboardTeams,
      config.targetGameDurationSeconds,
      score,
    )
  } else {
    const message: LeaderboardUpdate = {
      type: 'LeaderboardUpdate',
      teamBoxCounts: challengeLeaderboardTeams.map(
        x => x.score,
      ) as TeamBoxCounts,
      bannedPlayers,
      activePlayers,
      globalStandings: fillAndSortByTeamNumber(globalStandings).map(
        x => x.score,
      ) as TeamBoxCounts,
    }
    await ctx.realtime.send(INSTALL_REALTIME_CHANNEL, message)
  }
}

Devvit.addSchedulerJob({
  name: 'LEADERBOARD_UPDATE',
  onRun,
})
