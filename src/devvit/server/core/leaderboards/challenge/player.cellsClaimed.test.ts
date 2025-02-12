import {expect} from 'vitest'
import type {T2} from '../../../../../shared/types/tid'
import {DevvitTest} from '../../_utils/DevvitTest'
import {
  playerStatsCellsClaimedGet,
  playerStatsCellsClaimedIncrementForMember,
} from './player.cellsClaimed'

DevvitTest.it('should increment, and get challenge stats', async ctx => {
  await playerStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 't2_foo',
  })
  await playerStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 't2_foo',
  })
  await playerStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 't2_bar',
  })
  await playerStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 't2_bar',
    incrementBy: -1,
  })
  await playerStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 't2_baz',
  })

  await expect(
    playerStatsCellsClaimedGet({
      redis: ctx.redis,
      challengeNumber: 0,
      sort: 'DESC',
    }),
  ).resolves.toEqual([
    {member: 't2_foo', score: 2},
    {member: 't2_baz', score: 1},
    {member: 't2_bar', score: 0},
  ] satisfies Array<{member: T2; score: number}>)

  await expect(
    playerStatsCellsClaimedGet({
      redis: ctx.redis,
      challengeNumber: 0,
      sort: 'ASC',
    }),
  ).resolves.toEqual([
    {member: 't2_bar', score: 0},
    {member: 't2_baz', score: 1},
    {member: 't2_foo', score: 2},
  ] satisfies Array<{member: T2; score: number}>)
})
