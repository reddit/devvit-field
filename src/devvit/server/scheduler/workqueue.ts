import {counter, gauge, histogram} from '@devvit/metrics'
import type {ZMember} from '@devvit/protos'
import type {JobContext, TriggerContext} from '@devvit/public-api'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const.js'
import type {
  BatchMessage,
  DevvitMessage,
} from '../../../shared/types/message.js'

export const taskDeadlineMillis = 2000

export type Task = {
  type: string
  maxAttempts?: number
  key?: string
  attempts?: number
}

export type Handler<T extends Task> = (wq: WorkQueue, task: T) => Promise<void>

type SendRealtimeMessageTask = Task & {
  type: 'SendRealtimeMessage'
  msg: DevvitMessage
}

const tasksKey = 'workqueue:tasks'
export const claimsKey = 'workqueue:claims'
const lockKey = 'workqueue:lock'
const announceBatchKey = 'workqueue:announce:batch'
const announceCounterKey = 'workqueue:announce:counter'
const announceLastTimeKey = 'workqueue:announce:last-time'
const announceLockKey = 'workqueue:announce:lock'

// TODO: make into settings
const maxConcurrentClaims = 4
const defaultMaxAttempts = 5
const maxTransactionAttempts = 10
const maxTaskHandleTimeSec = 1
const maxTaskAgeMs = 300_000
const announceBatchMaxHoldTimeMillis = 1_000
const announceBatchMaxSize = 8

type WorkQueueSettings = {
  'workqueue-debug'?: string
  'workqueue-polling-interval-ms'?: number
  'workqueue-batch-realtime-send'?: string
}

// Metrics.

const buckets = [
  0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0,
]
const metrics = {
  tasksCompleted: counter({
    name: 'workqueue_tasks_completed',
    labels: ['type'],
  }),

  tasksFailed: counter({
    name: 'workqueue_tasks_failed',
    labels: ['type'],
  }),

  tasksPermanentlyFailed: counter({
    name: 'workqueue_tasks_permanently_failed',
    labels: ['type'],
  }),

  taskHandlerDurationSeconds: histogram({
    name: 'workqueue_task_handler_duration_seconds',
    labels: ['type', 'success'],
    buckets,
  }),

  tasksProcessedPerRun: histogram({
    name: 'workqueue_tasks_processed_per_run',
    labels: ['type'],
    buckets: [1, 2, 4, 8, 16, 32, 64, 128, 256],
  }),

  numTasks: gauge({
    name: 'workqueue_num_tasks',
    labels: [],
  }),

  numClaims: gauge({
    name: 'workqueue_num_claims',
    labels: [],
  }),

  lockAttempts: counter({
    name: 'workqueue_lock_attempts',
    labels: ['key', 'success'],
  }),

  lockRequests: counter({
    name: 'workqueue_lock_requests',
    labels: ['key', 'success'],
  }),

  lockDurationSeconds: histogram({
    name: 'workqueue_lock_duration_seconds',
    labels: ['key'],
    buckets,
  }),

  lockAcquisitionLatencySeconds: histogram({
    name: 'workqueue_lock_acquisition_latency_seconds',
    labels: ['key', 'success'],
    buckets,
  }),
}

export async function workQueueInit(ctx: TriggerContext): Promise<void> {
  // Ensure the workqueue lock key has an expiration, to avoid total deadlock.
  await ctx.redis.expire(lockKey, maxTaskHandleTimeSec)
}

export async function newWorkQueue(ctx: JobContext): Promise<WorkQueue> {
  const settings = await ctx.settings.getAll<WorkQueueSettings>()
  return new WorkQueue(ctx, settings)
}

export class WorkQueue {
  // biome-ignore lint/suspicious/noExplicitAny: type of task varies
  static #handlers: Record<string, Handler<any>> = {}
  readonly ctx: JobContext
  #id: string
  #debugEnabled = false
  #batchRealtimeSendEnabled = false
  #pollIntervalMs: number

  static register<T extends Task>(
    type: T['type'],
    handler: Handler<T>,
  ): Handler<T> {
    this.#handlers[type] = handler
    return handler
  }

  constructor(ctx: JobContext, settings: WorkQueueSettings) {
    this.ctx = ctx
    this.#id = `workqueue[${Date.now() % 60_000}]:`
    this.#debugEnabled = settings['workqueue-debug'] === 'true'
    this.#batchRealtimeSendEnabled =
      settings['workqueue-batch-realtime-send'] === 'true'
    this.#pollIntervalMs = settings['workqueue-polling-interval-ms'] ?? 10
  }

  #debug(...args: readonly unknown[]) {
    if (this.#debugEnabled) {
      console.log(...[this.#id, ...args])
    }
  }

  async enqueue<T extends Task>(task: T): Promise<void> {
    const taskKey = WorkQueue.serialize(task)
    this.#debug(`enqueueing task ${taskKey}`)
    await this.ctx.redis.zAdd(tasksKey, {
      member: taskKey,
      score: Date.now(),
    })
  }

  async runUntil(deadline: Date): Promise<void> {
    this.#debug(`runUntil ${deadline}`)

    let inFlight = 0
    const observations: Record<string, number> = {}

    const handleTasks = (tasks: Task[]) => {
      inFlight += tasks.length
      this.#debug(
        `taking on ${tasks.length} tasks (total of ${inFlight} in flight)`,
      )
      //this.#debug(`increment inFlight to ${inFlight}`)
      const resolve = async () => {
        inFlight--
      }
      for (const task of tasks) {
        //this.#debug('registering in flight task')
        observations[task.type] = (observations[task.type] ?? 0) + 1
        this.#handle(task).finally(resolve)
      }
    }

    while (new Date() < deadline) {
      const avail = maxConcurrentClaims - inFlight
      if (avail <= 0) {
        this.#debug(
          `max claims in flight, sleeping for ${this.#pollIntervalMs} ms`,
        )
        await sleep(this.#pollIntervalMs)
        continue
      }
      const nextTasks = await this.#claimOneBatch(avail)
      if (inFlight === 0 && !nextTasks.length) {
        this.#debug('no work to do, returning')
        break
      }
      this.#debug(`handling ${nextTasks.length} tasks`)
      handleTasks(nextTasks)
      // No need to await this flush before sleeping.
      this.#maybeFlushAnnounceBatch()
      await sleep(this.#pollIntervalMs)
    }
    for (const [type, count] of Object.entries(observations)) {
      metrics.tasksProcessedPerRun.labels(type).observe(count)
    }
  }

  async #claimOneBatch(n: number): Promise<Task[]> {
    return withLock(
      this.ctx,
      lockKey,
      async () => this.#claimOneBatchUnderLock(n),
      [],
      '#claimOneBatch',
    )
  }

  async #timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      return await fn()
    } finally {
      const dur = performance.now() - start
      if (dur > 1_000) {
        console.log(`slow operation ${name} took ${dur} ms`)
      }
    }
  }

  async #claimOneBatchUnderLock(n: number): Promise<Task[]> {
    const [numTasks, numClaims] = await Promise.all([
      this.#timed('zcard tasks', () => this.ctx.redis.zCard(tasksKey)),
      this.#timed('zcard claims', () => this.ctx.redis.zCard(claimsKey)),
    ])
    this.#debug(`numTasks=${numTasks}, numClaims=${numClaims}`)
    metrics.numTasks.labels().set(numTasks)
    metrics.numClaims.labels().set(numClaims)
    if (numClaims > 0) {
      const tasks = await this.#stealTasksUnderLock(n)
      if (tasks?.length) {
        this.#debug(`stole ${tasks.length} claims`)
        return tasks
      }
    }
    const tasks = await this.#claimTasksUnderLock(n)
    this.#debug(`claimed ${tasks.length} tasks`)
    return tasks
  }

  #membersToTasks(members: ZMember[]): Task[] {
    return members.map(({member}) => {
      const task = JSON.parse(member)
      task.key = member
      return task
    })
  }

  async #claimTasksUnderLock(n: number): Promise<Task[]> {
    const removed = await this.#timed('zRemRangeByScore', () =>
      this.ctx.redis.zRemRangeByScore(tasksKey, 0, Date.now() - maxTaskAgeMs),
    )
    if (removed) {
      console.warn(`[workqueue] dropped ${removed} old tasks`)
    }
    const claimableMembers = await this.#timed('zRange', () =>
      this.ctx.redis.zRange(tasksKey, '-inf', '+inf', {
        by: 'score',
        limit: {
          offset: 0,
          count: n,
        },
      }),
    )
    if (!claimableMembers || !claimableMembers.length) {
      //this.#debug('no tasks available to claim, discarding transaction')
      return []
    }

    //this.#debug(`claiming ${claimableMembers.length} tasks`)
    const tasksToClaim = this.#membersToTasks(claimableMembers)
    const now = Date.now()
    const claimedMembers = tasksToClaim.map(task => ({
      member: task.key!,
      score: now,
    }))
    await this.#timed('zAdd', () =>
      this.ctx.redis.zAdd(claimsKey, ...claimedMembers),
    )
    await this.#timed('zRem', () =>
      this.ctx.redis.zRem(
        tasksKey,
        tasksToClaim.map(task => task.key!),
      ),
    )
    return tasksToClaim
  }

  async #stealTasksUnderLock(n: number): Promise<Task[]> {
    const removed = await this.#timed('zRemRangeByScore claims', () =>
      this.ctx.redis.zRemRangeByScore(claimsKey, 0, Date.now() - maxTaskAgeMs),
    )
    if (removed) {
      console.warn(`[workqueue] dropped ${removed} old claims`)
    }
    const claimableMembers = await this.#timed('zRange claims', () =>
      this.ctx.redis.zRange(
        claimsKey,
        '-inf',
        Date.now() - taskDeadlineMillis,
        {
          by: 'score',
          limit: {
            offset: 0,
            count: n,
          },
        },
      ),
    )
    if (!claimableMembers || !claimableMembers.length) {
      return []
    }

    const tasksToSteal = this.#membersToTasks(claimableMembers)
    const now = Date.now()
    const claimedMembers = tasksToSteal.map(task => ({
      member: task.key!,
      score: now,
    }))
    await this.#timed('zadd', () =>
      this.ctx.redis.zAdd(claimsKey, ...claimedMembers),
    )
    return tasksToSteal
  }

  async #handle(task: Task): Promise<void> {
    const handler = WorkQueue.#handlers[task.type]
    if (!handler) {
      console.warn(
        `workqueue: no task handler registered for type ${task.type}`,
        task,
      )
      return
    }

    this.#debug(`handling task: ${task.key}`)
    let failed = false
    const start = performance.now()
    let end: number = 0
    try {
      await handler(this, task)
    } catch (error) {
      end = performance.now() - start
      failed = true
      await this.ctx.redis.zRem(claimsKey, [task.key!])
      // Update retry count and reassign key, to mark for immediate stealing.
      task.attempts = (task.attempts ?? 0) + 1
      delete task.key
      task.key = JSON.stringify(task)
      const maxAttempts = task.maxAttempts ?? defaultMaxAttempts
      metrics.tasksFailed.labels(task.type).inc()
      if (task.attempts >= maxAttempts) {
        metrics.tasksPermanentlyFailed.labels(task.type).inc()
        console.error(`workqueue: permanent failure: ${task.key}`)
        if (error instanceof Error && error.stack) {
          console.log(`workqueue: stack trace:\n${error.stack}`)
        }
        await this.ctx.redis.zRem(claimsKey, [task.key!])
      } else {
        await sleep(task.attempts * 100 + 50 * Math.random())
        // Add back to claims queue with score adjusted back in time, to give
        // it a higher priority.
        await this.ctx.redis.zAdd(claimsKey, {
          member: task.key,
          score: Date.now() - maxTaskAgeMs / 2,
        })
      }
    } finally {
      if (!end) {
        end = performance.now() - start
      }
      metrics.taskHandlerDurationSeconds
        .labels(task.type, failed ? 'false' : 'true')
        .observe((end - start) / 1_000)
      if (!failed) {
        metrics.tasksCompleted.labels(task.type).inc()
        this.#debug(`deleting claim ${task.key}`)
        await this.ctx.redis.zRem(claimsKey, [task.key!])
      }
    }
  }

  static serialize(task: Task): string {
    if (task.key) {
      return task.key
    }
    const key = JSON.stringify(task)
    task.key = key
    return key
  }

  async sendRealtime(msg: DevvitMessage): Promise<void> {
    if (this.#batchRealtimeSendEnabled) {
      const msgId = await this.ctx.redis.incrBy(announceCounterKey, 1)
      await this.ctx.redis.hSet(announceBatchKey, {
        [`${msgId}`]: JSON.stringify(msg),
      })
      // As good a time as any to flush. No need to await.
      this.#maybeFlushAnnounceBatch()
    } else {
      await this.ctx.realtime.send(INSTALL_REALTIME_CHANNEL, msg)
    }
  }

  async #maybeFlushAnnounceBatch(): Promise<void> {
    await withLock<void>(
      this.ctx,
      announceLockKey,
      async () => {
        const lastTimeMillis =
          parseInt((await this.ctx.redis.get(announceLastTimeKey)) ?? '0') || 0
        if (Date.now() - lastTimeMillis < announceBatchMaxHoldTimeMillis) {
          // Too soon to send, unless batch size is large enough.
          const length = await this.ctx.redis.hLen(announceBatchKey)
          if (length < announceBatchMaxSize) return
        }

        const fields = await this.ctx.redis.hGetAll(announceBatchKey)
        const msgIds: string[] = []
        const batch: DevvitMessage[] = []
        for (const [msgId, msg] of Object.entries(fields)) {
          msgIds.push(msgId)
          batch.push(JSON.parse(msg) as DevvitMessage)
        }
        if (msgIds.length === 0) return undefined
        const batchMessage: BatchMessage = {
          type: 'BatchMessage',
          batch,
        }
        await this.enqueue<SendRealtimeMessageTask>({
          type: 'SendRealtimeMessage',
          msg: batchMessage,
        })
        await this.ctx.redis.hDel(announceBatchKey, msgIds)
        await this.ctx.redis.set(announceLastTimeKey, `${Date.now()}`)
        this.#debug(`batched ${msgIds.length} realtime messages`)
      },
      undefined,
    )
  }
}

export async function withLock<T>(
  ctx: JobContext,
  key: string,
  fn: () => Promise<T>,
  orElse: T,
  debugTag: string = '',
): Promise<T> {
  const start = performance.now()
  let attempts = 0
  while (attempts < maxTransactionAttempts) {
    attempts++
    const res = await ctx.redis.hSetNX(key, 'lock', `${Date.now()}`)
    const acquired = res > 0
    metrics.lockAttempts.labels(key, `${acquired}`).inc()
    if (acquired) {
      const holdStart = performance.now()
      metrics.lockAcquisitionLatencySeconds
        .labels(key, 'true')
        .observe((holdStart - start) / 1_000)
      metrics.lockRequests.labels(key, 'true').inc()
      await ctx.redis.expire(key, maxTaskHandleTimeSec)
      try {
        return await fn()
      } finally {
        await ctx.redis.hDel(key, ['lock'])
        const dur = performance.now() - holdStart
        metrics.lockDurationSeconds.labels(key).observe(dur / 1_000)
        if (dur > 1_000) {
          console.log(
            `slow operation involving ${key} took ${dur} ms:`,
            debugTag,
          )
        }
      }
    }

    const val = await ctx.redis.hGet(key, 'lock')
    if (val) {
      const ts = parseInt(val) ?? ''
      if (ts < Date.now() - maxTaskHandleTimeSec * 1_000) {
        // Lock should have expired, but didn't! So we'll delete it here and retry.
        console.log(`deleting stale lock! age was ${ts - Date.now()} ms`)
        await ctx.redis.del(key)
        continue
      }
    }
    //console.log(`failed to acquire lock, value ${val} expires at ${await ctx.redis.expireTime(key)}`)
    await sleep(attempts * 100 + 50 * Math.random())
  }
  metrics.lockRequests.labels(key, 'false').inc()
  metrics.lockAcquisitionLatencySeconds
    .labels(key, 'false')
    .observe((performance.now() - start) / 1_000)
  return orElse
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

WorkQueue.register<SendRealtimeMessageTask>(
  'SendRealtimeMessage',
  async (wq: WorkQueue, task: SendRealtimeMessageTask) => {
    await wq.ctx.realtime.send(INSTALL_REALTIME_CHANNEL, task.msg)
  },
)
