import type {BitfieldCommand} from '@devvit/public-api'
import {beforeEach, expect} from 'vitest'
import {type Profile, makeRandomSeed} from '../../../shared/save'
import {getTeamFromUserId} from '../../../shared/team'
import {USER_IDS} from '../../../shared/test-utils'
import type {ChallengeConfig} from '../../../shared/types/challenge-config.js'
import type {Delta} from '../../../shared/types/field'
import {DevvitTest} from './_utils/DevvitTest'
import {toMatrix} from './_utils/utils'
import {parseBitfieldToFlatArray} from './bitfieldHelpers'
import {challengeConfigClearCache, challengeMakeNew} from './challenge'
import {deltasGet} from './deltas'
import {
  FIELD_CELL_BITS,
  _fieldClaimCellsSuccess,
  fieldClaimCells,
  fieldGet,
  fieldGetDeltas,
} from './field'
import {teamStatsCellsClaimedForTeam} from './leaderboards/challenge/team.cellsClaimed'
import {teamStatsMinesHitForTeam} from './leaderboards/challenge/team.minesHit'
import {userGet, userSet} from './user'

beforeEach(() => {
  challengeConfigClearCache()
})

// TODO: Tests for the partition level checks
DevvitTest.it('fieldClaimCells - should throw on out of bounds', async ctx => {
  const {challengeNumber} = await challengeMakeNew({
    ctx,
    config: {
      size: 2,
      seed: makeRandomSeed(),
      mineDensity: 0,
      partitionSize: 2,
    },
  })

  await expect(() =>
    fieldClaimCells({
      coords: [{x: -1, y: 0}],
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      ctx,
    }),
  ).rejects.toThrow(/Out of bounds/)

  await expect(() =>
    fieldClaimCells({
      coords: [{x: 2, y: 0}],
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      ctx,
    }),
  ).rejects.toThrow(/Out of bounds/)

  await expect(() =>
    fieldClaimCells({
      coords: [{x: 0, y: 2}],
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      ctx,
    }),
  ).rejects.toThrow(/Out of bounds/)
})

DevvitTest.it(
  'fieldClaimCells - should claim a cell and return if it was claimed',
  async ctx => {
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        size: 2,
        seed: makeRandomSeed(),
        mineDensity: 0,
        partitionSize: 2,
      },
    })

    const result = await fieldClaimCells({
      coords: [{x: 1, y: 1}],
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      ctx,
    })

    const deltas: Delta[] = [{globalXY: {x: 1, y: 1}, isBan: false, team: 2}]

    expect(result).toEqual({
      deltas,
    })

    await expect(
      fieldGetDeltas({
        challengeNumber,
        subredditId: ctx.subredditId,
        redis: ctx.redis,
        partitionXY: {x: 0, y: 0},
      }),
    ).resolves.toEqual(deltas)

    expect(
      toMatrix({
        result: await fieldGet({
          challengeNumber,
          subredditId: ctx.subredditId,
          redis: ctx.redis,
          partitionXY: {x: 0, y: 0},
        }),
        cols: 2,
        rows: 2,
      }),
    ).toEqual([
      ['_', '_'],
      ['_', '2'],
    ])
  },
)

DevvitTest.it(
  'fieldClaimCells - should claim a cell for a partition and return if it was claimed',
  async ctx => {
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        size: 10,
        seed: makeRandomSeed(),
        mineDensity: 0,
        partitionSize: 2,
      },
    })

    const result = await fieldClaimCells({
      coords: [{x: 8, y: 8}],
      challengeNumber,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      ctx,
    })

    const deltas: Delta[] = [{globalXY: {x: 8, y: 8}, isBan: false, team: 2}]

    expect(result).toEqual({
      deltas,
    })

    await expect(
      fieldGetDeltas({
        challengeNumber,
        subredditId: ctx.subredditId,
        redis: ctx.redis,
        partitionXY: {x: 4, y: 4},
      }),
    ).resolves.toEqual(deltas)

    expect(
      toMatrix({
        result: await fieldGet({
          challengeNumber,
          subredditId: ctx.subredditId,
          redis: ctx.redis,
          partitionXY: {x: 4, y: 4},
        }),
        cols: 2,
        rows: 2,
      }),
    ).toEqual([
      ['2', '_'],
      ['_', '_'],
    ])
  },
)

DevvitTest.it('fieldClaimCells - should claim multiple cells', async ctx => {
  await userSet({
    redis: ctx.redis,
    user: {
      currentLevel: 0,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
      t2: USER_IDS.TEAM_2_PLAYER_1,
      username: 'foo',
      superuser: false,
      hasVerifiedEmail: true,
    },
  })

  const {challengeNumber} = await challengeMakeNew({
    ctx,
    config: {size: 2, seed: makeRandomSeed(), mineDensity: 0, partitionSize: 2},
  })

  const result = await fieldClaimCells({
    coords: [
      {x: 0, y: 0},
      {x: 1, y: 1},
    ],
    userId: USER_IDS.TEAM_2_PLAYER_1,
    challengeNumber,
    ctx,
  })

  const deltas: Delta[] = [
    {globalXY: {x: 0, y: 0}, isBan: false, team: 2},
    {globalXY: {x: 1, y: 1}, isBan: false, team: 2},
  ]

  expect(result).toEqual({
    deltas,
  })

  await expect(
    fieldGetDeltas({
      challengeNumber,
      subredditId: ctx.subredditId,
      redis: ctx.redis,
      partitionXY: {x: 0, y: 0},
    }),
  ).resolves.toEqual(deltas)

  expect(
    toMatrix({
      result: await fieldGet({
        challengeNumber,
        subredditId: ctx.subredditId,
        redis: ctx.redis,
        partitionXY: {x: 0, y: 0},
      }),
      cols: 2,
      rows: 2,
    }),
  ).toEqual([
    ['2', '_'],
    ['_', '2'],
  ])
})

DevvitTest.it(
  'fieldClaimCells - should not return if cell already claimed',
  async ctx => {
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
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
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_3_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        size: 2,
        seed: makeRandomSeed(),
        mineDensity: 0,
        partitionSize: 2,
      },
    })

    await fieldClaimCells({
      coords: [{x: 1, y: 1}],
      userId: USER_IDS.TEAM_3_PLAYER_1,
      challengeNumber,
      ctx,
    })

    // Claiming again and deltas should not return anything
    const result = await fieldClaimCells({
      coords: [{x: 1, y: 1}],
      userId: USER_IDS.TEAM_2_PLAYER_1,
      challengeNumber,
      ctx,
    })

    expect(result).toEqual({deltas: []})
  },
)

DevvitTest.it(
  'fieldClaimCells - redis should respect order of return of multiple commands',
  async ctx => {
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        size: 2,
        seed: makeRandomSeed(),
        mineDensity: 0,
        partitionSize: 2,
      },
    })

    await fieldClaimCells({
      coords: [{x: 1, y: 1}],
      userId: USER_IDS.TEAM_2_PLAYER_1,
      challengeNumber,
      ctx,
    })

    // Under the hood we rely on the order that the coords passed in to be respected
    // by redis.
    const result = await fieldClaimCells({
      coords: [
        {x: 0, y: 0},
        {x: 1, y: 1},
        {x: 0, y: 1},
      ],
      userId: USER_IDS.TEAM_2_PLAYER_1,
      challengeNumber,
      ctx,
    })

    expect(result).toEqual({
      deltas: [
        {globalXY: {x: 0, y: 0}, isBan: false, team: 2},
        {globalXY: {x: 0, y: 1}, isBan: false, team: 2},
      ],
    })
  },
)

DevvitTest.it(
  '_fieldClaimCellsSuccess - should game over for user when hitting a mine and count team stats',
  async ctx => {
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    const challengeConfig: ChallengeConfig = {
      size: 2,
      seed: makeRandomSeed(),
      mineDensity: 0,
      partitionSize: 2,
      totalNumberOfMines: 0,
    }
    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: challengeConfig,
    })

    const deltas: Delta[] = [
      {globalXY: {x: 0, y: 0}, isBan: false, team: 2},
      {globalXY: {x: 1, y: 1}, isBan: true, team: 2},
    ]

    await _fieldClaimCellsSuccess({
      challengeNumber,
      ctx,
      deltas,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      fieldConfig: challengeConfig,
    })

    await expect(
      deltasGet({challengeNumber, redis: ctx.redis}),
    ).resolves.toEqual(deltas)

    await expect(
      userGet({
        redis: ctx.redis,
        userId: USER_IDS.TEAM_2_PLAYER_1,
      }),
    ).resolves.toEqual({
      currentLevel: 1,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
      superuser: false,
      t2: 't2_4cgfmlvzgq',
      username: 'foo',
      hasVerifiedEmail: true,
    } satisfies Profile)

    await expect(
      teamStatsCellsClaimedForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId(USER_IDS.TEAM_2_PLAYER_1),
      }),
    ).resolves.toEqual(2)

    await expect(
      teamStatsMinesHitForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId(USER_IDS.TEAM_2_PLAYER_1),
      }),
    ).resolves.toEqual(1)

    // Not called because game is technically not over at 50% claimed
    expect(ctx.realtime.send).toHaveBeenCalledTimes(0)
  },
)

DevvitTest.it(
  '_fieldClaimCellsSuccess - should end the game when second place cannot overtake first place',
  async ctx => {
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    const challengeConfig: ChallengeConfig = {
      size: 2,
      seed: makeRandomSeed(),
      mineDensity: 0,
      partitionSize: 2,
      totalNumberOfMines: 0,
    }
    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: challengeConfig,
    })

    const deltas: Delta[] = [
      {globalXY: {x: 0, y: 0}, isBan: false, team: 2},
      {globalXY: {x: 1, y: 1}, isBan: false, team: 2},
      {globalXY: {x: 1, y: 2}, isBan: false, team: 2},
    ]

    await _fieldClaimCellsSuccess({
      challengeNumber,
      ctx,
      deltas,
      userId: USER_IDS.TEAM_2_PLAYER_1,
      fieldConfig: challengeConfig,
    })

    await expect(
      deltasGet({challengeNumber, redis: ctx.redis}),
    ).resolves.toEqual(deltas)

    await expect(
      userGet({
        redis: ctx.redis,
        userId: USER_IDS.TEAM_2_PLAYER_1,
      }),
    ).resolves.toEqual(
      expect.objectContaining({lastPlayedChallengeNumberCellsClaimed: 3}),
    )

    await expect(
      teamStatsCellsClaimedForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId(USER_IDS.TEAM_2_PLAYER_1),
      }),
    ).resolves.toEqual(3)

    await expect(
      teamStatsMinesHitForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId(USER_IDS.TEAM_2_PLAYER_1),
      }),
    ).resolves.toEqual(0)

    expect(ctx.realtime.send).toHaveBeenCalledTimes(1)
  },
)

DevvitTest.it(
  'fieldGetDeltas - should return empty array if no deltas',
  async ctx => {
    const challengeConfig: ChallengeConfig = {
      size: 2,
      seed: makeRandomSeed(),
      mineDensity: 0,
      partitionSize: 2,
      totalNumberOfMines: 0,
    }
    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: challengeConfig,
    })

    await expect(
      fieldGetDeltas({
        challengeNumber,
        subredditId: ctx.subredditId,
        partitionXY: {x: 0, y: 0},
        redis: ctx.redis,
      }),
    ).resolves.toEqual([])
  },
)

DevvitTest.it(
  'get should return the field in the exact order that redis would using many bitfield commands',
  async _ctx => {
    const redis = DevvitTest.con
    const key = 'foo'
    const rows = 2
    const cols = 2

    await redis.bitfield(
      key,
      'set',
      'u3',
      '9',
      '7',
      'set',
      'u3',
      '0',
      // @ts-expect-error - bitfield types are borked
      '7',
    )

    expect(await redis.bitfield(key, 'GET', 'u3', 0)).toEqual([7])
    expect(await redis.bitfield(key, 'GET', 'u3', 3)).toEqual([0])
    expect(await redis.bitfield(key, 'GET', 'u3', 6)).toEqual([0])
    expect(await redis.bitfield(key, 'GET', 'u3', 9)).toEqual([7])

    const commands: BitfieldCommand[] = []

    for (let i = 0; i < cols * rows; i++) {
      commands.push(['get', 'u3', i * FIELD_CELL_BITS])
    }

    const result = await redis.bitfield(
      key,
      // @ts-expect-error - not sure
      ...commands.flat(),
    )

    expect(result).toEqual([7, 0, 0, 7])

    const buffer = await redis.getBuffer(key)

    // Fails because the function returns this: [0,4,3,0]
    expect(parseBitfieldToFlatArray(buffer!, cols, rows)).toEqual([7, 0, 0, 7])
  },
)
