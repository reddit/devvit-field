import {histogram} from '@devvit/metrics'
import {
  type DeltaSnapshotKey,
  fieldS3Path,
} from '../../../shared/codecs/deltacodec.js'
import type {XY} from '../../../shared/types/2d.js'
import {currentChallengeStartTimeMillisKey} from '../../../shared/types/challenge-config.js'
import type {PartitionUpdate} from '../../../shared/types/message.js'
import {
  challengeConfigGet,
  challengeMaybeGetCurrentChallengeNumber,
} from '../core/challenge.ts'
import type {Uploader} from '../core/deltas.ts'
import {
  createFieldPartitionSnapshotKey,
  fieldEndGame,
  fieldGetPartitionMapEncoded,
  fieldPartitionPublish,
  fieldSetPartitionMapLatestSnapshotKey,
} from '../core/field.ts'
import {
  type ClientOptions,
  Client as S3Client,
  getPathPrefix,
} from '../core/s3.ts'
import {computePreciseScore} from '../core/score.ts'
import {type Task, WorkQueue} from './workqueue.ts'

const buckets = [
  0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0,
  30.0,
]

const metrics = {
  durationSeconds: histogram({
    name: 'emit_partition_duration_seconds',
    labels: ['challenge', 'partition'],
    buckets,
  }),

  writeDurationSeconds: histogram({
    name: 'emit_partition_write_duration_seconds',
    labels: ['challenge', 'partition'],
    buckets,
  }),
}

type EmitPartitionTask = Task & {
  type: 'EmitPartition'
  subredditId: string
  challengeNumber: number
  partitionXY: XY
  sequenceNumber: number
}

WorkQueue.register<EmitPartitionTask>(
  'EmitPartition',
  async (wq: WorkQueue, task: EmitPartitionTask): Promise<void> => {
    const start = performance.now()
    const encoded = await fieldGetPartitionMapEncoded(
      wq.ctx.redis,
      wq.ctx.subredditId,
      task.challengeNumber,
      task.partitionXY,
    )
    const setStart = performance.now()
    await wq.ctx.redis.set(
      createFieldPartitionSnapshotKey(
        task.challengeNumber,
        task.partitionXY,
        task.sequenceNumber,
      ),
      encoded,
      {expiration: new Date(Date.now() + 600_000)}, // 10 minutes
    )
    metrics.writeDurationSeconds
      .labels(
        `${task.challengeNumber}`,
        `${task.partitionXY.x},${task.partitionXY.y}`,
      )
      .observe((performance.now() - setStart) / 1_000)

    const key: DeltaSnapshotKey = {
      kind: 'partition',
      pathPrefix: await getPathPrefix(wq.ctx.settings),
      noChange: false,
      ...task,
    }

    // Schedule followup tasks.
    await wq.enqueue({
      type: 'PublishPartition',
      ref: key,
    })

    metrics.durationSeconds
      .labels(
        `${task.challengeNumber}`,
        `${task.partitionXY.x},${task.partitionXY.y}`,
      )
      .observe((performance.now() - start) / 1_000)

    // Double check whether game should be over.
    await wq.enqueue({
      type: 'CheckGameOver',
      subredditId: task.subredditId,
      challengeNumber: task.challengeNumber,
      partitionXY: task.partitionXY,
    })
  },
)

type CheckGameOverTask = Task & {
  type: 'CheckGameOver'
  subredditId: string
  challengeNumber: number
  partitionXY: XY
}

WorkQueue.register<CheckGameOverTask>(
  'CheckGameOver',
  async (wq: WorkQueue, task: CheckGameOverTask): Promise<void> => {
    const currentChallengeNumber =
      await challengeMaybeGetCurrentChallengeNumber({
        redis: wq.ctx.redis,
      })
    if (currentChallengeNumber !== task.challengeNumber) return

    const config = await challengeConfigGet({
      challengeNumber: task.challengeNumber,
      subredditId: task.subredditId,
      redis: wq.ctx.redis,
    })

    let startTimeMs = 0
    const startedStr = await wq.ctx.redis.get(
      currentChallengeStartTimeMillisKey,
    )
    if (startedStr) startTimeMs = parseFloat(startedStr) || 0
    const score = await computePreciseScore(
      wq.ctx,
      task.challengeNumber,
      startTimeMs,
    )
    if (!score.isOver) return

    // Fire a challenge complete event and start the new challenge!
    await fieldEndGame(
      wq.ctx,
      currentChallengeNumber,
      score.teams,
      config.targetGameDurationSeconds,
      score,
    )
  },
)

type PublishPartitionTask = Task & {
  type: 'PublishPartition'
  ref: DeltaSnapshotKey
}

WorkQueue.register<PublishPartitionTask>(
  'PublishPartition',
  async (wq: WorkQueue, task: PublishPartitionTask): Promise<void> => {
    const settings: ClientOptions & {
      'skip-s3'?: boolean
      's3-path-prefix': string
    } = await wq.ctx.settings.getAll()

    const uploader: Uploader = {
      async upload(key: DeltaSnapshotKey, body: Buffer): Promise<void> {
        const client = new S3Client(settings)
        if (!settings['skip-s3']) {
          const path = fieldS3Path(key)
          // console.log(`s3 upload to ${path}`)
          await client.send({
            path,
            body,
            contentType: 'application/binary',
          })
        }
      },
    }

    const key = await fieldPartitionPublish(
      uploader,
      await getPathPrefix(wq.ctx.settings),
      wq.ctx.redis,
      task.ref.subredditId,
      task.ref.challengeNumber,
      task.ref.sequenceNumber,
      task.ref.partitionXY,
    )
    await fieldSetPartitionMapLatestSnapshotKey(wq.ctx.redis, key)

    await wq.enqueue({
      type: 'AnnouncePartition',
      maxAttempts: 3, // Only retry realtime sends 3 times, not 5
      ref: key,
    })
  },
)

type AnnouncePartitionTask = Task & {
  type: 'AnnouncePartition'
  ref: DeltaSnapshotKey
}

WorkQueue.register<AnnouncePartitionTask>(
  'AnnouncePartition',
  async (wq: WorkQueue, task: AnnouncePartitionTask): Promise<void> => {
    await wq.sendRealtime({
      type: 'PartitionUpdate',
      key: task.ref,
    } satisfies PartitionUpdate)
  },
)
