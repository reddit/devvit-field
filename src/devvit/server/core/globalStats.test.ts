import {beforeEach, expect} from 'vitest'
import {DevvitTest} from './_utils/DevvitTest'
import {
  type GlobalStats,
  globalStatsGet,
  globalStatsIncrement,
  globalStatsInitialState,
} from './globalStats'

beforeEach(async () => {
  // Needed because we are testing global redis
  await DevvitTest.resetRedis()
})

DevvitTest.it('increment, and get global stats', async ctx => {
  await expect(globalStatsGet({redis: ctx.redis})).resolves.toStrictEqual(
    globalStatsInitialState,
  )

  await globalStatsIncrement({
    redis: ctx.redis,
    field: 'totalPlayers',
  })

  await expect(globalStatsGet({redis: ctx.redis})).resolves.toStrictEqual({
    ...globalStatsInitialState,
    totalPlayers: 1,
  } satisfies GlobalStats)
})
