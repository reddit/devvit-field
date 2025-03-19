import type {MenuItem} from '@devvit/public-api'
import {flushWorkQueue} from '../server/scheduler/workqueue.js'

export const flushWorkQueueAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Flush WorkQueue',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    await dropRealtimeQueue(ctx)
    await flushWorkQueue(ctx)
  },
})
