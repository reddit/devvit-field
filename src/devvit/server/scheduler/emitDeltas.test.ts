import {describe, expect} from 'vitest'
import {DeltaCodec} from '../../../shared/codecs/deltacodec'
import {makeRandomSeed} from '../../../shared/save'
import {USER_IDS} from '../../../shared/test-utils'
import type {ChallengeConfig} from '../../../shared/types/challenge-config'
import type {Delta} from '../../../shared/types/field'
import {DevvitTest} from '../core/_utils/DevvitTest'
import {challengeMakeNew} from '../core/challenge'
import {deltasGet, getChallengeDeltasEncodedSnapshotKey} from '../core/deltas'
import {_fieldClaimCellsSuccess} from '../core/field'
import {teamStatsCellsClaimedGetTotal} from '../core/leaderboards/challenge/team.cellsClaimed'
import {userSet} from '../core/user'
import {onRun} from './emitDeltas'

describe('emitDeltas', async () => {
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
      size: 100,
      partitionSize: 25,
      mineDensity: 0,
      seed: makeRandomSeed(),
      totalNumberOfMines: 250,
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

    // First: add some deltas. Note these span two partitions.
    const deltas: Delta[] = [
      {
        globalXY: {x: 0, y: 0},
        team: 2,
        isBan: false,
      },
      {
        globalXY: {x: 1, y: 0},
        team: 2,
        isBan: false,
      },
      {
        globalXY: {x: 25, y: 25},
        team: 2,
        isBan: false,
      },
    ]

    // Handle some "clicks" on these cells
    await _fieldClaimCellsSuccess({
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      deltas: deltas,
      ctx,
      fieldConfig,
    })

    // Then, run the job...
    await onRun({name: 'run', data: undefined}, ctx)

    // By the end of the job, there should be no deltas left
    await expect(
      deltasGet(ctx.redis, challengeNumber, {x: 0, y: 0}),
    ).resolves.toStrictEqual([])

    // And they should have been moved to... sequence number 1 for processing.
    let encoded = await ctx.redis.get(
      getChallengeDeltasEncodedSnapshotKey(challengeNumber, {x: 0, y: 0}, 1),
    )
    expect(encoded).toBeTruthy()
    let codec = new DeltaCodec({x: 0, y: 0}, fieldConfig.partitionSize)
    let retrieved = codec.decode(Buffer.from(encoded!, 'base64'))
    expect(retrieved).toStrictEqual(deltas.slice(0, 2))

    encoded = await ctx.redis.get(
      getChallengeDeltasEncodedSnapshotKey(challengeNumber, {x: 1, y: 1}, 1),
    )
    expect(encoded).toBeTruthy()
    codec = new DeltaCodec({x: 1, y: 1}, fieldConfig.partitionSize)
    retrieved = codec.decode(Buffer.from(encoded!, 'base64'))
    expect(retrieved).toStrictEqual(deltas.slice(2, 3))

    // Team stats should've been moved and accumulated.
    const members = await teamStatsCellsClaimedGetTotal(
      ctx.redis,
      challengeNumber,
    )
    expect(members).toStrictEqual([{member: 2, score: 3}])

    // Finally, one more delta
    const deltasTwo: Delta[] = [
      {
        globalXY: {x: 24, y: 24},
        team: 0,
        isBan: false,
      },
    ]

    await _fieldClaimCellsSuccess({
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      deltas: deltasTwo,
      ctx,
      fieldConfig,
    })

    // TODO: Verify score updates

    // Run the job again, this time there should be a new sequence number and more deltas to process
    await onRun({name: 'run', data: undefined}, ctx)

    await expect(
      ctx.redis.get(`challenge:${challengeNumber}:deltas_sequence`),
    ).resolves.toStrictEqual('2')
  })
})
