import {type Mock, describe, expect} from 'vitest'
import {makeRandomSeed} from '../../../shared/save'
import {USER_IDS} from '../../../shared/test-utils'
import type {ChallengeConfig} from '../../../shared/types/challenge-config'
import {DevvitTest} from '../core/_utils/DevvitTest'
import {
  challengeGetCurrentChallengeNumber,
  challengeMakeNew,
} from '../core/challenge'
import {_fieldClaimCellsSuccess} from '../core/field'
import {teamStatsCellsClaimedRotate} from '../core/leaderboards/challenge/team.cellsClaimed'
import {userSet} from '../core/user'
import {onRun} from './leaderboardUpdate'

describe('leaderboardUpdate', async () => {
  DevvitTest.it('multiple complete heartbeats', async ctx => {
    const innerLog = console.log
    console.log = (...args) => {
      innerLog(...[`[${(new Date()).toISOString()}]`, ...args])
    }

    DevvitTest.updateSettings({
      's3-path-prefix': 'dev',
      'skip-s3': true,
      'workqueue-debug': true,
    })

    const fieldConfig: ChallengeConfig = {
      size: 2,
      partitionSize: 2,
      mineDensity: 0,
      seed: makeRandomSeed(),
      totalNumberOfMines: 0,
      targetGameDurationSeconds: 0,
    }
    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: fieldConfig,
    })
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        globalPointCount: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        globalPointCount: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_3_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    const realtimeMock = ctx.realtime.send as Mock
    realtimeMock.mockClear()

    /////////////////////////////////////////////////////////////////////////////
    // PART ONE: click on some cells, then verify the job sends LeaderboardUpdate.

    // Team 2 does a click
    await _fieldClaimCellsSuccess({
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      deltas: [{globalXY: {x: 0, y: 0}, team: 2, isBan: false}],
      ctx,
      fieldConfig,
    })
    // Team 3 does a click
    await _fieldClaimCellsSuccess({
      challengeNumber,
      userId: USER_IDS.TEAM_3_PLAYER_1,
      deltas: [{globalXY: {x: 0, y: 1}, team: 3, isBan: false}],
      ctx,
      fieldConfig,
    })

    // Rotate and aggregate to total for team's claimed cells
    await teamStatsCellsClaimedRotate(ctx.redis, challengeNumber, 1, {
      x: 0,
      y: 0,
    })

    // Run the scheduled job, then ensure the deltas are processed and LeaderboardUpdate fired
    await onRun({name: 'run', data: undefined}, ctx)

    expect(realtimeMock).toHaveBeenCalledWith(
      'channel',
      expect.objectContaining({
        type: 'LeaderboardUpdate',
        teamBoxCounts: [0, 0, 1, 1],
        bannedPlayers: 0,
        activePlayers: 1,
      }),
    )
    realtimeMock.mockClear()

    /////////////////////////////////////////////////////////////////////////////
    // PART TWO: click on one more cell to end the game, then verify the job sends ChallengeComplete.

    await _fieldClaimCellsSuccess({
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      deltas: [
        {globalXY: {x: 1, y: 1}, team: 2, isBan: false},
        {globalXY: {x: 1, y: 0}, team: 2, isBan: false},
      ],
      ctx,
      fieldConfig,
    })

    // Rotate and aggregate to total for team's claimed cells
    await teamStatsCellsClaimedRotate(ctx.redis, challengeNumber, 1, {
      x: 0,
      y: 0,
    })

    // Run the scheduled job, then ensure the deltas are processed and LeaderboardUpdate fired
    await onRun({name: 'run', data: undefined}, ctx)

    // Expect a ChallengeComplete event
    expect(realtimeMock).toHaveBeenCalledWith(
      'channel',
      expect.objectContaining({
        type: 'ChallengeComplete',
        challengeNumber,
        standings: [
          {member: 0, score: 0},
          {member: 1, score: 0},
          {member: 2, score: 3},
          {member: 3, score: 1},
        ],
      }),
    )

    // And expect that the new challenge was started (challenge number incremented)
    expect(
      await challengeGetCurrentChallengeNumber({redis: ctx.redis}),
    ).toStrictEqual(challengeNumber + 1)
  })
})
