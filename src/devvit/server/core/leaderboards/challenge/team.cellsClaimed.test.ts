import {expect} from 'vitest'
import type {Team} from '../../../../../shared/team'
import {DevvitTest} from '../../_utils/DevvitTest'
import {
  teamStatsCellsClaimedGet,
  teamStatsCellsClaimedIncrementForMember,
  teamStatsCellsClaimedInit,
} from './team.cellsClaimed'

DevvitTest.it('should init, increment, and get challenge stats', async ctx => {
  await teamStatsCellsClaimedInit({redis: ctx.redis, challengeNumber: 0})

  await expect(
    teamStatsCellsClaimedGet({redis: ctx.redis, challengeNumber: 0}),
  ).resolves.toEqual([
    {member: 3, score: 0},
    {member: 2, score: 0},
    {member: 1, score: 0},
    {member: 0, score: 0},
  ] satisfies Array<{member: Team; score: number}>)

  await teamStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 0,
  })
  await teamStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 0,
  })
  await teamStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 1,
  })
  await teamStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 1,
    incrementBy: -1,
  })
  await teamStatsCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 2,
  })

  await expect(
    teamStatsCellsClaimedGet({
      redis: ctx.redis,
      challengeNumber: 0,
      sort: 'DESC',
    }),
  ).resolves.toEqual([
    {member: 0, score: 2},
    {member: 2, score: 1},
    {member: 3, score: 0},
    {member: 1, score: 0},
  ] satisfies Array<{member: Team; score: number}>)

  await expect(
    teamStatsCellsClaimedGet({
      redis: ctx.redis,
      challengeNumber: 0,
      sort: 'ASC',
    }),
  ).resolves.toEqual([
    {member: 1, score: 0},
    {member: 3, score: 0},
    {member: 2, score: 1},
    {member: 0, score: 2},
  ] satisfies Array<{member: Team; score: number}>)
})
