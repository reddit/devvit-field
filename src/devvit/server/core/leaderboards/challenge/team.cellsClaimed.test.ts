import {expect} from 'vitest'
import type {Team} from '../../../../../shared/team'
import {DevvitTest} from '../../_utils/DevvitTest'
import {
  teamStatsCellsClaimedForTeamPartitioned,
  teamStatsCellsClaimedGetPartitioned,
  teamStatsCellsClaimedGetTotal,
  teamStatsCellsClaimedIncrementForMemberPartitioned,
  teamStatsCellsClaimedIncrementForMemberTotal,
} from './team.cellsClaimed'

DevvitTest.it(
  'should init, increment, and get total challenge stats',
  async ctx => {
    await expect(
      teamStatsCellsClaimedGetTotal(ctx.redis, 0),
    ).resolves.toStrictEqual([] satisfies Array<{member: Team; score: number}>)

    await teamStatsCellsClaimedIncrementForMemberTotal(ctx.redis, 0, 0)
    await teamStatsCellsClaimedIncrementForMemberTotal(ctx.redis, 0, 0)
    await teamStatsCellsClaimedIncrementForMemberTotal(ctx.redis, 0, 1)
    await teamStatsCellsClaimedIncrementForMemberTotal(ctx.redis, 0, 1, 2)
    await teamStatsCellsClaimedIncrementForMemberTotal(ctx.redis, 0, 2)

    await expect(
      teamStatsCellsClaimedGetTotal(ctx.redis, 0, 'DESC'),
    ).resolves.toStrictEqual([
      {member: 1, score: 3},
      {member: 0, score: 2},
      {member: 2, score: 1},
    ] satisfies Array<{member: Team; score: number}>)

    await expect(
      teamStatsCellsClaimedGetTotal(ctx.redis, 0, 'ASC'),
    ).resolves.toStrictEqual([
      {member: 2, score: 1},
      {member: 0, score: 2},
      {member: 1, score: 3},
    ] satisfies Array<{member: Team; score: number}>)
  },
)

DevvitTest.it(
  'should init, increment, and get challenge stats by partition',
  async ctx => {
    const partitionsPerSide = 4
    const testPartition = {
      x: Math.floor(Math.random() * partitionsPerSide),
      y: Math.floor(Math.random() * partitionsPerSide),
    }

    await expect(
      teamStatsCellsClaimedForTeamPartitioned(ctx.redis, 0, testPartition, 0),
    ).resolves.toBe(0)

    await expect(
      teamStatsCellsClaimedGetPartitioned(ctx.redis, 0, testPartition),
    ).resolves.toStrictEqual([] satisfies Array<{member: Team; score: number}>)

    await teamStatsCellsClaimedIncrementForMemberPartitioned(
      ctx.redis,
      0,
      testPartition,
      0,
    )
    await teamStatsCellsClaimedIncrementForMemberPartitioned(
      ctx.redis,
      0,
      testPartition,
      0,
    )
    await teamStatsCellsClaimedIncrementForMemberPartitioned(
      ctx.redis,
      0,
      testPartition,
      1,
    )
    await teamStatsCellsClaimedIncrementForMemberPartitioned(
      ctx.redis,
      0,
      testPartition,
      1,
      2,
    )
    await teamStatsCellsClaimedIncrementForMemberPartitioned(
      ctx.redis,
      0,
      testPartition,
      2,
    )

    await expect(
      teamStatsCellsClaimedForTeamPartitioned(ctx.redis, 0, testPartition, 0),
    ).resolves.toBe(2)

    await expect(
      teamStatsCellsClaimedGetPartitioned(ctx.redis, 0, testPartition, 'DESC'),
    ).resolves.toStrictEqual([
      {member: 1, score: 3},
      {member: 0, score: 2},
      {member: 2, score: 1},
    ] satisfies Array<{member: Team; score: number}>)

    await expect(
      teamStatsCellsClaimedGetPartitioned(ctx.redis, 0, testPartition, 'ASC'),
    ).resolves.toStrictEqual([
      {member: 2, score: 1},
      {member: 0, score: 2},
      {member: 1, score: 3},
    ] satisfies Array<{member: Team; score: number}>)
  },
)
