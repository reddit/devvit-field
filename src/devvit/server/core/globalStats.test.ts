import {beforeEach, expect} from 'vitest'
import {DevvitTest} from './_utils/DevvitTest'
import {
  type GlobalStats,
  globalStatsGet,
  globalStatsIncrement,
  globalStatsInit,
  globalStatsInitialState,
} from './globalStats'

beforeEach(async () => {
  // Needed because we are testing global redis
  await DevvitTest.resetRedis()
})

DevvitTest.it('should init, increment, and get global stats', async ctx => {
  await globalStatsInit({redis: ctx.redis, globalNumber: 0})

  await expect(
    globalStatsGet({redis: ctx.redis, globalNumber: 0}),
  ).resolves.toStrictEqual(globalStatsInitialState)

  await globalStatsIncrement({
    redis: ctx.redis,
    globalNumber: 0,
    field: 'totalPlayers',
  })

  await expect(
    globalStatsGet({redis: ctx.redis, globalNumber: 0}),
  ).resolves.toStrictEqual({
    ...globalStatsInitialState,
    totalPlayers: 1,
  } satisfies GlobalStats)
})

DevvitTest.it(
  'calling init global stats twice should not overwrite',
  async ctx => {
    await globalStatsInit({redis: ctx.redis, globalNumber: 0})

    await globalStatsIncrement({
      redis: ctx.redis,
      globalNumber: 0,
      field: 'totalPlayers',
    })

    await globalStatsInit({redis: ctx.redis, globalNumber: 0})

    await expect(
      globalStatsGet({redis: ctx.redis, globalNumber: 0}),
    ).resolves.toStrictEqual({
      ...globalStatsInitialState,
      totalPlayers: 1,
    } satisfies GlobalStats)
  },
)
