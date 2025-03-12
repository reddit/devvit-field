import {
  type DeltaSnapshotKey,
  fieldPartitionS3Path,
} from '../../../shared/codecs/deltacodec.js'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const.js'
import type {XY} from '../../../shared/types/2d.js'
import type {Uploader} from '../core/deltas.ts'
import {
  createFieldPartitionSnapshotKey,
  fieldGetPartitionMapEncoded,
  fieldPartitionPublish,
  fieldSetPartitionMapLatestSnapshotKey,
} from '../core/field.ts'
import {
  type ClientOptions,
  Client as S3Client,
  getPathPrefix,
} from '../core/s3.ts'
import {type Task, WorkQueue} from './workqueue.ts'

type EmitPartitionTask = Task & {
  type: 'EmitPartition'
  challengeNumber: number
  partitionXY: XY
  sequenceNumber: number
}

WorkQueue.register<EmitPartitionTask>(
  'EmitPartition',
  async (wq: WorkQueue, task: EmitPartitionTask): Promise<void> => {
    const encoded = await fieldGetPartitionMapEncoded(
      wq.ctx.redis,
      wq.ctx.subredditId,
      task.challengeNumber,
      task.partitionXY,
    )
    await wq.ctx.redis.set(
      createFieldPartitionSnapshotKey(
        task.challengeNumber,
        task.partitionXY,
        task.sequenceNumber,
      ),
      encoded,
    )

    const key: DeltaSnapshotKey = {
      kind: 'partition',
      pathPrefix: await getPathPrefix(wq.ctx.settings),
      ...task,
    }

    // Schedule followup tasks.
    await wq.enqueue({
      type: 'PublishPartition',
      ref: key,
    })
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
          const path = fieldPartitionS3Path(key)
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
      task.ref.challengeNumber,
      task.ref.sequenceNumber,
      task.ref.partitionXY,
    )
    await fieldSetPartitionMapLatestSnapshotKey(wq.ctx.redis, key)

    await wq.enqueue({
      type: 'AnnouncePartition',
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
    await wq.ctx.realtime.send(INSTALL_REALTIME_CHANNEL, {
      type: 'PartitionUpdate',
      snapshotKey: task.ref,
    })
  },
)
