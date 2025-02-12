import {beforeEach, expect} from 'vitest'
import type {Team} from '../../../../../shared/team'
import {DevvitTest} from '../../_utils/DevvitTest'
import {
  leaderboardGet,
  leaderboardIncrementForTeam,
  leaderboardInit,
} from './leaderboard'

beforeEach(async () => {
  await DevvitTest.resetRedis()
})

DevvitTest.it('should init, increment, and get challenge stats', async ctx => {
  await leaderboardInit({redis: ctx.redis})

  await expect(leaderboardGet({redis: ctx.redis})).resolves.toEqual([
    {member: 3, score: 0},
    {member: 2, score: 0},
    {member: 1, score: 0},
    {member: 0, score: 0},
  ] satisfies Array<{member: Team; score: number}>)

  await leaderboardIncrementForTeam({
    redis: ctx.redis,
    member: 0,
  })
  await leaderboardIncrementForTeam({
    redis: ctx.redis,
    member: 0,
  })
  await leaderboardIncrementForTeam({
    redis: ctx.redis,
    member: 1,
  })
  await leaderboardIncrementForTeam({
    redis: ctx.redis,
    member: 1,
    incrementBy: -1,
  })
  await leaderboardIncrementForTeam({
    redis: ctx.redis,
    member: 2,
  })

  await expect(
    leaderboardGet({redis: ctx.redis, sort: 'DESC'}),
  ).resolves.toEqual([
    {member: 0, score: 2},
    {member: 2, score: 1},
    {member: 3, score: 0},
    {member: 1, score: 0},
  ] satisfies Array<{member: Team; score: number}>)

  await expect(
    leaderboardGet({redis: ctx.redis, sort: 'ASC'}),
  ).resolves.toEqual([
    {member: 1, score: 0},
    {member: 3, score: 0},
    {member: 2, score: 1},
    {member: 0, score: 2},
  ] satisfies Array<{member: Team; score: number}>)
})
