import {
  Devvit,
  type JSONObject,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {getPartitionCoords, makePartitionKey} from '../../../shared/partition'
import type {PartitionKey} from '../../../shared/types/2d'
import type {Delta} from '../../../shared/types/field'
import {challengeMaybeGetCurrentChallengeNumber} from '../core/challenge'
import {challengeConfigGet} from '../core/challenge'
import {deltasClear, deltasGet} from '../core/deltas'

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
  const currentChallengeNumber = await challengeMaybeGetCurrentChallengeNumber({
    redis: ctx.redis,
  })
  if (!currentChallengeNumber) return

  const config = await challengeConfigGet({
    challengeNumber: currentChallengeNumber,
    redis: ctx.redis,
  })

  // TODO: Acquire a lock on a special key to prevent multiple jobs running on top
  // of each other. They run every 1 second no matter what. Event if the previous
  // one hasn't finished.

  const deltas = await deltasGet({
    challengeNumber: currentChallengeNumber,
    redis: ctx.redis,
  })

  /**
   * Roll through all deltas and group them by partition
   */
  const partitionMap: Record<PartitionKey, Delta[]> = {}

  for (const delta of deltas) {
    const partition = getPartitionCoords(delta.globalXY, config.partitionSize)
    const partitionKey = makePartitionKey(partition)

    partitionMap[partitionKey] = [...(partitionMap[partitionKey] || []), delta]
  }

  /**
   * Loop through all partitions and send the deltas as realtime messages
   */
  const partitionKeys = Object.keys(partitionMap) as PartitionKey[]

  // This is best effort and we don't retry
  await Promise.allSettled(
    partitionKeys.map(partitionKey => {
      const deltas = partitionMap[partitionKey]!
      return ctx.realtime.send(partitionKey, {
        // TODO: Encode in a fancy way
        deltas,
      })
    }),
  )

  await deltasClear({
    challengeNumber: currentChallengeNumber,
    redis: ctx.redis,
  })
}

Devvit.addSchedulerJob({
  name: 'FIELD_UPDATE',
  onRun,
})
