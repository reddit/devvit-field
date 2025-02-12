import {expect} from 'vitest'
import {makeRandomSeed} from '../../../shared/save'
import {getTeamFromUserId} from '../../../shared/team'
import {DevvitTest} from './_utils/DevvitTest'
import {toMatrix} from './_utils/utils'
import {type ChallengeConfig, challengeMakeNew} from './challenge'
import {type Delta, deltasGet} from './deltas'
import {_fieldClaimCellsSuccess, fieldClaimCells, fieldGet} from './field'
import {playerStatsCellsClaimedForMember} from './leaderboards/challenge/player.cellsClaimed'
import {teamStatsCellsClaimedForTeam} from './leaderboards/challenge/team.cellsClaimed'
import {teamStatsMinesHitForTeam} from './leaderboards/challenge/team.minesHit'

DevvitTest.it('fieldClaimCells - should throw on out of bounds', async ctx => {
  const {challengeNumber} = await challengeMakeNew({
    ctx,
    config: {size: 2, seed: makeRandomSeed(), mineDensity: 0, partitionSize: 2},
  })

  await expect(() =>
    fieldClaimCells({
      coords: [{x: -1, y: 0}],
      challengeNumber,
      userId: 't2_foo',
      ctx,
    }),
  ).rejects.toThrow(/Out of bounds/)

  await expect(() =>
    fieldClaimCells({
      coords: [{x: 2, y: 0}],
      challengeNumber,
      userId: 't2_foo',
      ctx,
    }),
  ).rejects.toThrow(/Out of bounds/)

  await expect(() =>
    fieldClaimCells({
      coords: [{x: 0, y: 2}],
      challengeNumber,
      userId: 't2_foo',
      ctx,
    }),
  ).rejects.toThrow(/Out of bounds/)
})

DevvitTest.it(
  'fieldClaimCells - should claim a cell and return if it was claimed',
  async ctx => {
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
      userId: 't2_foo',
      ctx,
    })

    expect(result).toEqual({
      deltas: [{coord: {x: 1, y: 1}, isMine: false, team: 0}],
    })

    expect(
      toMatrix({
        result: await fieldGet({challengeNumber, redis: ctx.redis}),
        cols: 2,
        rows: 2,
      }),
    ).toEqual([
      ['_', '_'],
      ['_', '3'],
    ])
  },
)

DevvitTest.it('fieldClaimCells - should claim multiple cells', async ctx => {
  const {challengeNumber} = await challengeMakeNew({
    ctx,
    config: {size: 2, seed: makeRandomSeed(), mineDensity: 0, partitionSize: 2},
  })

  const result = await fieldClaimCells({
    coords: [
      {x: 0, y: 0},
      {x: 1, y: 1},
    ],
    userId: 't2_foo',
    challengeNumber,
    ctx,
  })

  expect(result).toEqual({
    deltas: [
      {coord: {x: 0, y: 0}, isMine: false, team: 0},
      {coord: {x: 1, y: 1}, isMine: false, team: 0},
    ],
  })

  expect(
    toMatrix({
      result: await fieldGet({challengeNumber, redis: ctx.redis}),
      cols: 2,
      rows: 2,
    }),
  ).toEqual([
    ['3', '_'],
    ['_', '3'],
  ])
})

DevvitTest.it(
  'fieldClaimCells - should not return if cell already claimed',
  async ctx => {
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
      userId: 't2_foo',
      challengeNumber,
      ctx,
    })

    // Claiming again and deltas should not return anything
    const result = await fieldClaimCells({
      coords: [{x: 1, y: 1}],
      userId: 't2_foo',
      challengeNumber,
      ctx,
    })

    expect(result).toEqual({deltas: []})
  },
)

DevvitTest.it(
  'fieldClaimCells - redis should respect order of return of multiple commands',
  async ctx => {
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
      userId: 't2_foo',
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
      userId: 't2_foo',
      challengeNumber,
      ctx,
    })

    expect(result).toEqual({
      deltas: [
        {coord: {x: 0, y: 0}, isMine: false, team: 0},
        {coord: {x: 0, y: 1}, isMine: false, team: 0},
      ],
    })
  },
)

DevvitTest.it(
  '_fieldClaimCellsSuccess - should game over for user when hitting a mine and count team stats',
  async ctx => {
    const challengeConfig: ChallengeConfig = {
      size: 2,
      seed: makeRandomSeed(),
      mineDensity: 0,
      partitionSize: 2,
    }
    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: challengeConfig,
    })

    const deltas: Delta[] = [
      {coord: {x: 0, y: 0}, isMine: false, team: 0},
      {coord: {x: 1, y: 1}, isMine: true, team: 0},
    ]

    await _fieldClaimCellsSuccess({
      challengeNumber,
      ctx,
      deltas,
      userId: 't2_foo',
      fieldConfig: challengeConfig,
    })

    await expect(
      deltasGet({challengeNumber, redis: ctx.redis}),
    ).resolves.toEqual(deltas)

    await expect(
      playerStatsCellsClaimedForMember({
        redis: ctx.redis,
        challengeNumber,
        member: 't2_foo',
      }),
    ).resolves.toEqual(-1)

    await expect(
      teamStatsCellsClaimedForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId('t2_foo'),
      }),
    ).resolves.toEqual(2)

    await expect(
      teamStatsMinesHitForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId('t2_foo'),
      }),
    ).resolves.toEqual(1)

    // Not called because game is technically not over at 50% claimed
    expect(ctx.realtime.send).toHaveBeenCalledTimes(0)
  },
)

DevvitTest.it(
  '_fieldClaimCellsSuccess - should end the game when second place cannot overtake first place',
  async ctx => {
    const challengeConfig: ChallengeConfig = {
      size: 2,
      seed: makeRandomSeed(),
      mineDensity: 0,
      partitionSize: 2,
    }
    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: challengeConfig,
    })

    const deltas: Delta[] = [
      {coord: {x: 0, y: 0}, isMine: false, team: 0},
      {coord: {x: 1, y: 1}, isMine: false, team: 0},
      {coord: {x: 1, y: 2}, isMine: false, team: 0},
    ]

    await _fieldClaimCellsSuccess({
      challengeNumber,
      ctx,
      deltas,
      userId: 't2_foo',
      fieldConfig: challengeConfig,
    })

    await expect(
      deltasGet({challengeNumber, redis: ctx.redis}),
    ).resolves.toEqual(deltas)

    await expect(
      playerStatsCellsClaimedForMember({
        redis: ctx.redis,
        challengeNumber,
        member: 't2_foo',
      }),
    ).resolves.toEqual(3)

    await expect(
      teamStatsCellsClaimedForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId('t2_foo'),
      }),
    ).resolves.toEqual(3)

    await expect(
      teamStatsMinesHitForTeam({
        redis: ctx.redis,
        challengeNumber,
        team: getTeamFromUserId('t2_foo'),
      }),
    ).resolves.toEqual(0)

    // Not called because game is technically not over at 50% claimed
    expect(ctx.realtime.send).toHaveBeenCalledTimes(1)
  },
)

// TODO: Need to figure out how to get the entire bitfield in order
// DevvitTest.it(
//   'get should return the field in the exact order that redis would using many bitfield commands',
//   async ctx => {
//     const key = 'foo'
//     const rows = 2
//     const cols = 2

//     await DevvitTest.con.bitfield(
//       key,
//       'set',
//       'u3',
//       '9',
//       '7',
//       'set',
//       'u3',
//       '0',
//       // @ts-expect-error - bitfield types are borked
//       '7',
//     )

//     expect(await DevvitTest.con.bitfield(key, 'GET', 'u3', 0)).toEqual([7])
//     expect(await DevvitTest.con.bitfield(key, 'GET', 'u3', 3)).toEqual([0])
//     expect(await DevvitTest.con.bitfield(key, 'GET', 'u3', 6)).toEqual([0])
//     expect(await DevvitTest.con.bitfield(key, 'GET', 'u3', 9)).toEqual([7])

//     const commands: BitfieldCommand[] = []

//     for (let i = 0; i < cols * rows; i++) {
//       commands.push(['get', 'u3', i * FIELD_CELL_BITS])
//     }

//     const result = await DevvitTest.con.bitfield(
//       key,
//       // @ts-expect-error - not sure
//       ...commands.flat(),
//     )

//     expect(
//       toMatrix({
//         result: result as number[],
//         cols: 2,
//         rows: 2,
//       }),
//     ).toEqual([
//       ['3', '_'],
//       ['_', '3'],
//     ])

//     /**
//      * How to return the entire bitfield in order?
//      */

//     const plainString = await DevvitTest.con.get(key)
//     const buffer = Buffer.from(plainString!)

//     const numbers: number[] = []
//     let bitOffset = 0

//     // AI slop, but it appears to work and show the issue
//     // The order is messed up when I pull it out of Redis this way
//     // It talks about this in order of the bits on https://redis.io/docs/latest/commands/bitfield/
//     while (bitOffset < buffer.length * 8) {
//       const byteIndex = Math.floor(bitOffset / 8)
//       const bitPosition = bitOffset % 8

//       // Get two consecutive bytes (if available)
//       const byte1 = buffer[byteIndex] || 0
//       const byte2 = buffer[byteIndex + 1] || 0

//       // Combine bytes and shift to get the 3 bits we want
//       const combined = (byte1 << 8) | byte2
//       const value = (combined >> (13 - bitPosition)) & 0b111

//       numbers.push(value)
//       bitOffset += 3
//     }

//     expect(
//       toMatrix({
//         result: numbers,
//         cols: 2,
//         rows: 2,
//       }),
//     ).toEqual([
//       ['3', '_'],
//       ['_', '3'],
//     ])
//   },
// )
