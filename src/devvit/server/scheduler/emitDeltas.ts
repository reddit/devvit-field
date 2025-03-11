import {
  Devvit,
  type JSONObject,
  type JobContext,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {
  type DeltaSnapshotKey,
  deltaS3Path,
} from '../../../shared/codecs/deltacodec.js'
import {partitionXYs} from '../../../shared/partition.js'
import type {XY} from '../../../shared/types/2d.js'
import {challengeMaybeGetCurrentChallengeNumber} from '../core/challenge'
import {challengeConfigGet} from '../core/challenge'
import {getSequenceRedisKey} from '../core/data/sequence.ts'
import {type Uploader, deltasPublish, deltasRotate} from '../core/deltas.ts'
import {teamStatsCellsClaimedRotate} from '../core/leaderboards/challenge/team.cellsClaimed.ts'
import {type ClientOptions, Client as S3Client} from '../core/s3.ts'
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
  challengeNumber: number
  partitionXY: XY
  partitionSize: number
  sequenceNumber: number
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
      challengeNumber: task.challengeNumber,
      partitionXY: task.partitionXY,
      sequenceNumber: task.sequenceNumber,
    })
  },
)

type PublishDeltasTask = Task & {
  type: 'PublishDeltas'
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

    let pathPrefix = settings['s3-path-prefix']!

    // Remove any trailing '/' from the path prefix, since we're requiring the
    // given key to start with '/'.
    while (pathPrefix.endsWith('/')) {
      pathPrefix = pathPrefix.substring(0, pathPrefix.length - 1)
    }

    // We have Fastly set up in front of our S3 bucket, and it will request the
    // key without a leading '/'.
    while (pathPrefix.startsWith('/')) {
      pathPrefix = pathPrefix.substring(1)
    }

    // Due to a quirk in how we set up Fastly in front of our S3 bucket, we're
    // only going to be able to read keys that begin with "/platform/a1/".
    pathPrefix = `platform/a1/${pathPrefix}`

    const uploader: Uploader = {
      async upload(key: DeltaSnapshotKey, body: Buffer): Promise<void> {
        const client = new S3Client(settings)
        if (!settings['skip-s3']) {
          //console.log(`s3 upload to ${deltaS3Path(key)}`)
          await client.send({
            path: deltaS3Path(key),
            body,
            contentType: 'application/binary',
          })
        }
      },
    }

    const key = await deltasPublish(
      uploader,
      pathPrefix,
      wq.ctx.redis,
      task.challengeNumber,
      task.sequenceNumber,
      task.partitionXY,
    )
    await wq.enqueue({
      type: 'AnnounceDeltas',
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
    // Due to a quirk of our Fastly VCL, we need to prefix the S3 key with "platform",
    // but must omit it from the URL.
    let pathPrefix = task.ref.pathPrefix
    const prefix = 'platform/'
    if (pathPrefix.startsWith(prefix)) {
      pathPrefix = pathPrefix.slice(prefix.length)
    }
    await wq.ctx.realtime.send('partition_update', {
      type: 'PartitionUpdate',
      ref: {
        ...task.ref,
        pathPrefix,
      },
    })
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
  await heartbeatAllPartitions(ctx, wq)
  await wq.runUntil(new Date(start + 10_000))
}

async function heartbeatAllPartitions(ctx: JobContext, wq: WorkQueue) {
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
    getSequenceRedisKey(currentChallengeNumber),
    1,
  )
  for (const partitionXY of partitionXYs(config)) {
    await wq.enqueue({
      type: 'EmitDeltas',
      challengeNumber: currentChallengeNumber,
      partitionXY,
      partitionSize: config.partitionSize,
      sequenceNumber,
    })
  }
}

Devvit.addSchedulerJob({
  name: 'FIELD_UPDATE',
  onRun,
})
