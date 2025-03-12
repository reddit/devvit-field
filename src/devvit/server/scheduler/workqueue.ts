import type {ZMember} from '@devvit/protos'
import type {JobContext} from '@devvit/public-api'

export const taskDeadlineMillis = 5000

export type Task = {
  type: string
  key?: string
  attempts?: number
}

export type Handler<T extends Task> = (wq: WorkQueue, task: T) => Promise<void>

export const tasksKey = '{workqueue}:tasks'
export const claimsKey = '{workqueue}:claims'
export const lockKey = '{workqueue}:lock'

// TODO: make into settings
const maxConcurrentClaims = 48 // Enough to serve 16 partitions x 3 tasks per partition
const maxAttempts = 5
const maxTransactionAttempts = 10

type WorkQueueSettings = {
  'workqueue-debug'?: string
}

export async function newWorkQueue(ctx: JobContext): Promise<WorkQueue> {
  const settings = await ctx.settings.getAll<WorkQueueSettings>()
  const wq = new WorkQueue(ctx)
  wq.setDebugEnabled(settings['workqueue-debug'] === 'true')
  return wq
}

export class WorkQueue {
  // biome-ignore lint/suspicious/noExplicitAny: type of task varies
  static #handlers: Record<string, Handler<any>> = {}
  readonly ctx: JobContext
  #id: string
  #debugEnabled = false

  static register<T extends Task>(
    type: T['type'],
    handler: Handler<T>,
  ): Handler<T> {
    this.#handlers[type] = handler
    return handler
  }

  constructor(ctx: JobContext) {
    this.ctx = ctx
    this.#id = `workqueue[${Date.now() % 60_000}]:`
  }

  // biome-ignore lint/suspicious/noExplicitAny: just wrapping console.log here
  #debug(...args: any) {
    if (this.#debugEnabled) {
      console.log(...[this.#id, ...args])
    }
  }

  setDebugEnabled(enabled: boolean): void {
    this.#debugEnabled = enabled
  }

  async enqueue<T extends Task>(task: T): Promise<void> {
    const taskKey = WorkQueue.serialize(task)
    this.#debug(`enqueueing task ${taskKey}`)
    await this.ctx.redis.zAdd(tasksKey, {
      member: taskKey,
      score: Date.now(),
    })
  }

  async #sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async runUntil(deadline: Date): Promise<void> {
    let inFlight = 0

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
        this.#handle(task).finally(resolve)
      }
    }

    while (new Date() < deadline) {
      const avail = maxConcurrentClaims - inFlight
      if (avail <= 0) {
        await this.#sleep(100)
        continue
      }
      const nextTasks = await this.#claimOneBatch(avail)
      if (inFlight === 0 && !nextTasks.length) {
        break
      }
      handleTasks(nextTasks)
      await this.#sleep(100)
    }
  }

  async #claimOneBatch(n: number): Promise<Task[]> {
    const [numTasks, numClaims] = await Promise.all([
      this.ctx.redis.zCard(tasksKey),
      this.ctx.redis.zCard(claimsKey),
    ])
    this.#debug(`numTasks=${numTasks}, numClaims=${numClaims}`)
    if (numClaims > 0) {
      const tasks = await this.#stealTasks(n)
      if (tasks?.length) {
        this.#debug(`stole ${tasks.length} claims`)
        return tasks
      }
    }
    const tasks = await this.#claimTasks(n)
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

  async #withLock<T>(fn: () => Promise<T>, orElse: T): Promise<T> {
    // Acquire lock
    let attempts = 0
    while (attempts < maxTransactionAttempts) {
      attempts++
      const res = await this.ctx.redis.hSetNX(lockKey, 'lock', '')
      if (res > 0) {
        await this.ctx.redis.expire(lockKey, 1)
        try {
          return await fn()
        } finally {
          await this.ctx.redis.hDel(lockKey, ['lock'])
        }
      }
      await this.#sleep(attempts * 100 + 50 * Math.random())
    }
    this.#debug('gave up acquiring lock')
    return orElse
  }

  async #claimTasks(n: number): Promise<Task[]> {
    return this.#withLock(async () => this.#claimTasksUnderLock(n), [])
  }

  async #claimTasksUnderLock(n: number): Promise<Task[]> {
    const claimableMembers = await this.ctx.redis.zRange(
      tasksKey,
      '-inf',
      '+inf',
      {
        by: 'score',
        limit: {
          offset: 0,
          count: n,
        },
      },
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
    await this.ctx.redis.zAdd(claimsKey, ...claimedMembers)
    await this.ctx.redis.zRem(
      tasksKey,
      tasksToClaim.map(task => task.key!),
    )
    return tasksToClaim
  }

  async #stealTasks(n: number): Promise<Task[]> {
    return this.#withLock(async () => this.#stealTasksUnderLock(n), [])
  }

  async #stealTasksUnderLock(n: number): Promise<Task[]> {
    const claimableMembers = await this.ctx.redis.zRange(
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
    await this.ctx.redis.zAdd(claimsKey, ...claimedMembers)
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
    try {
      await handler(this, task)
    } catch (error) {
      failed = true
      console.error(`workqueue: error handling ${task.key}: ${error}`)
      if (error instanceof Error && error.stack) {
        console.log(`workqueue: stack trace:\n${error.stack}`)
      }
      await this.ctx.redis.zRem(claimsKey, [task.key!])
      // Update retry count and reassign key, to mark for immediate stealing.
      task.attempts = (task.attempts ?? 0) + 1
      delete task.key
      task.key = JSON.stringify(task)
      if (task.attempts >= maxAttempts) {
        console.error(`workqueue: permanent failure: ${task.key}`)
      } else {
        await this.ctx.redis.zAdd(claimsKey, {member: task.key!, score: 0})
      }
    } finally {
      if (!failed) {
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
}
