import {expect} from 'vitest'
import {DevvitTest} from './_utils/DevvitTest'
import {
  type ChallengeStats,
  challengeStatsGet,
  challengeStatsIncrement,
  challengeStatsInit,
  challengeStatsInitialState,
} from './challengeStats'

DevvitTest.it('should init, increment, and get challenge stats', async ctx => {
  challengeStatsInit({redis: ctx.redis, challengeNumber: 0})

  await expect(
    challengeStatsGet({redis: ctx.redis, challengeNumber: 0}),
  ).resolves.toEqual(challengeStatsInitialState)

  await challengeStatsIncrement({
    redis: ctx.redis,
    challengeNumber: 0,
    field: 'team:0:cellsClaimed',
  })
  await challengeStatsIncrement({
    redis: ctx.redis,
    challengeNumber: 0,
    field: 'team:1:cellsClaimed',
    incrementBy: 5,
  })
  await challengeStatsIncrement({
    redis: ctx.redis,
    challengeNumber: 0,
    field: 'team:1:cellsClaimed',
    incrementBy: -1,
  })
  await challengeStatsIncrement({
    redis: ctx.redis,
    challengeNumber: 0,
    field: 'team:1:minesHit',
    incrementBy: 2,
  })
  await challengeStatsIncrement({
    redis: ctx.redis,
    challengeNumber: 0,
    field: 'totalMinesHit',
    incrementBy: 1,
  })

  await expect(
    challengeStatsGet({redis: ctx.redis, challengeNumber: 0}),
  ).resolves.toEqual({
    ...challengeStatsInitialState,
    'team:0:cellsClaimed': 1,
    'team:1:cellsClaimed': 4,
    'team:1:minesHit': 2,
    totalMinesHit: 1,
  } satisfies ChallengeStats)
})
