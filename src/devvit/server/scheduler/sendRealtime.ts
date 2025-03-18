import type {TriggerContext} from '@devvit/public-api'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const.js'
import type {
  BatchMessage,
  DevvitMessage,
} from '../../../shared/types/message.js'
import {type Task, WorkQueue, withLock} from './workqueue.ts'

const maxMessagesPerBatch = 32
const maxGatherTimeMs = 1000

const realtimeQueueKey = '{workqueue}:realtime:queue'
const realtimeCounterKey = '{workqueue}:realtime:counter'
const realtimeLockKey = '{workqueue}:realtime:lock'
const realtimeLastSendKey = '{workqueue}:realtime:lastSend'

type SendRealtimeBatchTask = Task & {
  type: 'SendRealtimeBatchTask'
  batch: DevvitMessage[]
}

WorkQueue.register<SendRealtimeBatchTask>(
  'SendRealtimeBatchTask',
  async (wq: WorkQueue, task: SendRealtimeBatchTask): Promise<void> => {
    //const lastSent = parseFloat(await wq.ctx.redis.get(realtimeLastSendKey) ?? '0')
    //console.log(`sending batch of ${task.batch.length} realtime messages (interval=${Date.now()-lastSent})`)
    const msg: BatchMessage = {
      type: 'BatchMessage',
      batch: task.batch,
    }
    await wq.ctx.realtime.send(INSTALL_REALTIME_CHANNEL, msg)
    await wq.ctx.redis.set(realtimeLastSendKey, `${Date.now()}`)
  },
)

export async function realtimeInit(ctx: TriggerContext): Promise<void> {
  // Ensure the realtime lock key has an expiration, to avoid total deadlock.
  await ctx.redis.expire(realtimeLockKey, 1)
}

export async function sendRealtime(
  wq: WorkQueue,
  msg: DevvitMessage,
): Promise<void> {
  if (!(await wq.ctx.settings.get<boolean>('realtime-batch-enabled'))) {
    await wq.ctx.realtime.send(INSTALL_REALTIME_CHANNEL, msg)
    return
  }

  const ok = await withLock<boolean>(
    wq.ctx,
    realtimeLockKey,
    async () => {
      const empty = (await wq.ctx.redis.hLen(realtimeQueueKey)) === 0

      // Generate a sequence number to use as the hash field. We'll sort
      // by these when we process the queue, in order to maintain message order.
      const id = (await wq.ctx.redis.incrBy(
        realtimeCounterKey,
        1,
      )) as unknown as string
      await wq.ctx.redis.hSet(realtimeQueueKey, {[id]: JSON.stringify(msg)})

      // If we just enqueued the first message, reset the last send time,
      // so that long gaps between origination of messages don't cause
      // immediate sends.
      if (empty) {
        await wq.ctx.redis.set(realtimeLastSendKey, `${Date.now()}`)
      }
      return true
    },
    false,
  )
  if (!ok) {
    throw new Error('failed to enqueue realtime message')
  }
  await maybeFlushRealtime(wq)
}

export async function flushRealtime(wq: WorkQueue): Promise<void> {
  const ok = await withLock<boolean>(
    wq.ctx,
    realtimeLockKey,
    async () => {
      await flushRealtimeUnderLock(wq)
      return true
    },
    false,
  )
  if (!ok) {
    console.log('failed to flush realtime messages')
  }
}

export async function flushRealtimeUnderLock(wq: WorkQueue): Promise<void> {
  // Pending realtime messages are stored in a redis hash, where the field is
  // a sequence number indicating order. Fetch them all as [field, value]
  // entries, and then sort according to the field.
  const fields = await wq.ctx.redis.hGetAll(realtimeQueueKey)
  const entries = Object.entries(fields)
  if (!entries.length) {
    return
  }
  entries.sort((a, b) => parseInt(a[0]) - parseInt(b[1]))

  // Parse the messages and accumulate in hash field order.
  const msgs: DevvitMessage[] = []
  for (const entry of entries) {
    msgs.push(JSON.parse(entry[1]) as DevvitMessage)
  }

  // Enqueue the task to send the accumulated batch.
  const task: SendRealtimeBatchTask = {
    type: 'SendRealtimeBatchTask',
    batch: msgs,
  }
  await wq.enqueue(task)

  // Once the *task* is enqueued, delete the pending individual messages from
  // the realtime queue.
  await wq.ctx.redis.hDel(
    realtimeQueueKey,
    entries.map(e => e[0]),
  )
}

export async function maybeFlushRealtime(wq: WorkQueue): Promise<void> {
  const ok = await withLock<boolean>(
    wq.ctx,
    realtimeLockKey,
    async () => {
      const n = await wq.ctx.redis.hLen(realtimeQueueKey)
      const lastSend = parseFloat(
        (await wq.ctx.redis.get(realtimeLastSendKey)) ?? '0',
      )
      if (n < maxMessagesPerBatch && lastSend >= Date.now() - maxGatherTimeMs) {
        return true
      }
      await flushRealtimeUnderLock(wq)
      return true
    },
    false,
  )
  if (!ok) {
    console.log('failed to maybe flush realtime messages')
  }
}
