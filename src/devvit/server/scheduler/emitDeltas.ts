import {
  Devvit,
  type JSONObject,
  type JobContext,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {
  type DeltaSnapshotKey,
  fieldS3Path,
  partitionPeriod,
} from '../../../shared/codecs/deltacodec.js'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const.js'
import {partitionXYs} from '../../../shared/partition.js'
import type {XY} from '../../../shared/types/2d.js'
import type {PartitionUpdate} from '../../../shared/types/message.js'
import {challengeMaybeGetCurrentChallengeNumber} from '../core/challenge'
import {challengeConfigGet} from '../core/challenge'
import {getDeltaSequenceNumber} from '../core/data/sequence.ts'
import {type Uploader, deltasPublish, deltasRotate} from '../core/deltas.ts'
import {teamStatsCellsClaimedRotate} from '../core/leaderboards/challenge/team.cellsClaimed.ts'
import {
  type ClientOptions,
  Client as S3Client,
  getPathPrefix,
} from '../core/s3.ts'
import {type Task, WorkQueue, newWorkQueue} from './workqueue.ts'

/**
 * EmitDeltas tasks drive the snapshot/rotate of each partition's delta
 * accumulators. They also schedule immediate followup work to publish
 * and announce each snapshot.
 *
 * The workflow is a simple series of tasks.
 *
 *     EmitDeltas (Redis) -> PublishDeltas (S3) -> AnnounceDeltas (Realtime)
 */

type EmitDeltasTask = Task & {
  type: 'EmitDeltas'
  subredditId: string
  challengeNumber: number
  partitionXY: XY
  sequenceNumber: number
  partitionSize: number
}

WorkQueue.register<EmitDeltasTask>(
  'EmitDeltas',
  async (wq: WorkQueue, task: EmitDeltasTask): Promise<void> => {
    await deltasRotate(
      wq.ctx.redis,
      task.challengeNumber,
      task.sequenceNumber,
      task.partitionXY,
      task.partitionSize,
    )

    await teamStatsCellsClaimedRotate(
      wq.ctx.redis,
      task.challengeNumber,
      task.sequenceNumber,
      task.partitionXY,
    )

    // Schedule followup tasks.
    await wq.enqueue({
      type: 'PublishDeltas',
      subredditId: task.subredditId,
      challengeNumber: task.challengeNumber,
      partitionXY: task.partitionXY,
      sequenceNumber: task.sequenceNumber,
    })
  },
)

type PublishDeltasTask = Task & {
  type: 'PublishDeltas'
  subredditId: string
  challengeNumber: number
  partitionXY: XY
  sequenceNumber: number
}

WorkQueue.register<PublishDeltasTask>(
  'PublishDeltas',
  async (wq: WorkQueue, task: PublishDeltasTask): Promise<void> => {
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

    const key = await deltasPublish(
      uploader,
      await getPathPrefix(wq.ctx.settings),
      wq.ctx.redis,
      task.subredditId,
      task.challengeNumber,
      task.sequenceNumber,
      task.partitionXY,
    )
    await wq.enqueue({
      type: 'AnnounceDeltas',
      maxAttempts: 1, // Don't retry realtime sends
      ref: key,
    })
  },
)

type AnnounceDeltasTask = Task & {
  type: 'AnnounceDeltas'
  ref: DeltaSnapshotKey
}

WorkQueue.register<AnnounceDeltasTask>(
  'AnnounceDeltas',
  async (wq: WorkQueue, task: AnnounceDeltasTask): Promise<void> => {
    await wq.ctx.realtime.send(INSTALL_REALTIME_CHANNEL, {
      type: 'PartitionUpdate',
      key: task.ref,
    } satisfies PartitionUpdate)
  },
)

/**
 * Runs every second and emits the changes to the board that have accumulated.
 *
 * IMPORTANT NOTES:
 * - There are no guarantees on order
 * - There are no guarantees on delivery
 * - There are no guarantees you will receive message only once
 * - There are no guarantees you will receive all messages
 * - There are no guarantees that this is for the challenge number the user is currently on
 *   (we will encode the challenge number in a future iteration for clients to handle that)
 *
 * This is a best-effort system and should be treated as such. We hope to improve this
 * system over time.
 */
export const onRun: ScheduledJobHandler<JSONObject | undefined> = async (
  _,
  ctx,
): Promise<void> => {
  const wq = await newWorkQueue(ctx)
  const start = Date.now()
  await emitAllPartitions(ctx, wq)
  await wq.runUntil(new Date(start + 10_000))
}

async function emitAllPartitions(ctx: JobContext, wq: WorkQueue) {
  const currentChallengeNumber = await challengeMaybeGetCurrentChallengeNumber({
    redis: ctx.redis,
  })
  if (!currentChallengeNumber) return

  const config = await challengeConfigGet({
    challengeNumber: currentChallengeNumber,
    subredditId: ctx.subredditId,
    redis: ctx.redis,
  })
  const sequenceNumber = await ctx.redis.incrBy(
    getDeltaSequenceNumber(currentChallengeNumber),
    1,
  )

  const alsoEmitPartitions = sequenceNumber % partitionPeriod === 0
  for (const partitionXY of partitionXYs(config)) {
    await wq.enqueue({
      type: 'EmitDeltas',
      subredditId: ctx.subredditId,
      challengeNumber: currentChallengeNumber,
      partitionXY,
      sequenceNumber,
      partitionSize: config.partitionSize,
    })
    if (alsoEmitPartitions) {
      await wq.enqueue({
        type: 'EmitPartition',
        subredditId: ctx.subredditId,
        challengeNumber: currentChallengeNumber,
        partitionXY,
        partitionSize: config.partitionSize,
        sequenceNumber,
      })

      // Every ten seconds, also do a live config push if needed
      await wq.enqueue({
        type: 'EmitLiveConfig',
        maxAttempts: 1, // Don't retry realtime sends
      })
    }
  }
}

Devvit.addSchedulerJob({
  name: 'FIELD_UPDATE',
  onRun,
})
