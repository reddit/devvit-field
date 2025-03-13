import {Devvit, type TriggerContext} from '@devvit/public-api'
import {challengeOnInstall} from '../core/challenge'
import {leaderboardInit} from '../core/leaderboards/global/leaderboard'
import {teamStatsWinsInit} from '../core/leaderboards/subreddit/team.wins'
import {workQueueInit} from '../scheduler/workqueue.ts'

export const initialize = async (ctx: TriggerContext): Promise<void> => {
  await challengeOnInstall({redis: ctx.redis})
  await leaderboardInit({redis: ctx.redis})
  await teamStatsWinsInit({redis: ctx.redis})
  await workQueueInit(ctx)

  const jobs = await ctx.scheduler.listJobs()
  for (const job of jobs) {
    await ctx.scheduler.cancelJob(job.id)
  }

  await ctx.scheduler.runJob({
    cron: '* * * * * *', // non-standard cron, every second
    name: 'FIELD_UPDATE',
    data: {},
  })

  await ctx.scheduler.runJob({
    cron: '* * * * * *', // non-standard cron, every second
    name: 'LEADERBOARD_UPDATE',
    data: {},
  })
}

Devvit.addTrigger({
  events: ['AppInstall'],
  onEvent: async (_, ctx) => {
    await initialize(ctx)
  },
})
