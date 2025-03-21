import type {MenuItem} from '@devvit/public-api'
import {dropRealtimeQueue} from '../server/scheduler/sendRealtime.js'
import {flushWorkQueue, joltWorkQueue} from '../server/scheduler/workqueue.js'

export const joltWorkQueueAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Jolt WorkQueue',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    await joltWorkQueue(ctx)
  },
})

export const flushWorkQueueAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Flush WorkQueue',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    await dropRealtimeQueue(ctx)
    await flushWorkQueue(ctx)
  },
})
