import {Devvit, type TriggerContext} from '@devvit/public-api'
import {challengeOnInstall} from '../server/core/challenge'

export const initialize = async (ctx: TriggerContext): Promise<void> => {
  await challengeOnInstall(ctx)

  const jobs = await ctx.scheduler.listJobs()
  for (const job of jobs) {
    await ctx.scheduler.cancelJob(job.id)
  }

  await ctx.scheduler.runJob({
    cron: '* * * * * *', // non-standard cron, every second
    name: 'FIELD_UPDATE',
    data: {},
  })
}

Devvit.addTrigger({
  events: ['AppInstall'],
  onEvent: async (_, ctx) => {
    await initialize(ctx)
  },
})
