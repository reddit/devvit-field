import {expect} from 'vitest'
import type {Team} from '../../../../../shared/team'
import {DevvitTest} from '../../_utils/DevvitTest'
import {
  teamStatsMinesHitForTeam,
  teamStatsMinesHitGet,
  teamStatsMinesHitIncrementForMember,
  teamStatsMinesHitInit,
} from './team.minesHit'

DevvitTest.it('should init, increment, and get challenge stats', async ctx => {
  await expect(
    teamStatsMinesHitForTeam({
      redis: ctx.redis,
      challengeNumber: 0,
      team: 0,
    }),
  ).resolves.toBe(0)

  await teamStatsMinesHitInit({redis: ctx.redis, challengeNumber: 0})

  await expect(
    teamStatsMinesHitGet({redis: ctx.redis, challengeNumber: 0}),
  ).resolves.toStrictEqual([
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
    member: 2,
  })

  await expect(
    teamStatsMinesHitForTeam({
      redis: ctx.redis,
      challengeNumber: 0,
      team: 0,
    }),
  ).resolves.toBe(2)

  await expect(
    teamStatsMinesHitGet({
      redis: ctx.redis,
      challengeNumber: 0,
      sort: 'DESC',
    }),
  ).resolves.toStrictEqual([
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
  ).resolves.toStrictEqual([
    {member: 1, score: 0},
    {member: 3, score: 0},
    {member: 2, score: 1},
    {member: 0, score: 2},
  ] satisfies Array<{member: Team; score: number}>)
})
