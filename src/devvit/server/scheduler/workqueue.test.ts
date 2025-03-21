import {describe, expect} from 'vitest'
import {DevvitTest} from '../core/_utils/DevvitTest'
import {type Task, WorkQueue, claimsKey, taskDeadlineMillis} from './workqueue'

type TestTask = Task & {type: 'Test'}

describe('steal task', async () => {
  DevvitTest.it('steal task', async ctx => {
    // Register handler.
    let taskHandled = false
    WorkQueue.register<TestTask>('Test', async (_wq, _task) => {
      taskHandled = true
    })

    // Set up a stale claim
    const task: TestTask = {type: 'Test'}
    const taskKey = WorkQueue.serialize(task)
    await ctx.redis.zAdd(claimsKey, {
      member: taskKey,
      score: Date.now() - taskDeadlineMillis - 1_000,
    })

    // After running workqueue once, task should be handled.
    expect(taskHandled).eq(false)
    const wq = new WorkQueue(ctx, {})
    const deadline = new Date(Date.now() + 1_000)
    await wq.runUntil(deadline)
    expect(taskHandled).eq(true)
  })
})
