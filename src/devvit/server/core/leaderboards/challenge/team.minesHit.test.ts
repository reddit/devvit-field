import {expect} from 'vitest'
import type {Team} from '../../../../../shared/team'
import {DevvitTest} from '../../_utils/DevvitTest'
import {
  teamStatsMinesHitGet,
  teamStatsMinesHitIncrementForMember,
  teamStatsMinesHitInit,
} from './team.minesHit'

DevvitTest.it('should init, increment, and get challenge stats', async ctx => {
  await teamStatsMinesHitInit({redis: ctx.redis, challengeNumber: 0})

  await expect(
    teamStatsMinesHitGet({redis: ctx.redis, challengeNumber: 0}),
  ).resolves.toEqual([
    {member: 3, score: 0},
    {member: 2, score: 0},
    {member: 1, score: 0},
    {member: 0, score: 0},
  ] satisfies Array<{member: Team; score: number}>)

  await teamStatsMinesHitIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 0,
  })
  await teamStatsMinesHitIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 0,
  })
  await teamStatsMinesHitIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 1,
  })
  await teamStatsMinesHitIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 1,
    incrementBy: -1,
  })
  await teamStatsMinesHitIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: 2,
  })

  await expect(
    teamStatsMinesHitGet({
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
    teamStatsMinesHitGet({
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
