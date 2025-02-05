import {Devvit} from '@devvit/public-api'
import {challengeMaybeGetCurrentChallengeNumber} from '../server/core/challenge'

Devvit.addSchedulerJob({
  name: 'CHECK_MINEFIELD',
  onRun: async (_, ctx) => {
    const currentChallengeNumber =
      await challengeMaybeGetCurrentChallengeNumber({
        redis: ctx.redis,
      })
    if (!currentChallengeNumber) return

    await ctx.realtime.send(`challenge_${currentChallengeNumber}`, {
      now: new Date().toISOString(),
    })
  },
})
