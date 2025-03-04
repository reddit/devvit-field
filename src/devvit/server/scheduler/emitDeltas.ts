import {
  Devvit,
  type JSONObject,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {getPartitionCoords, makePartitionKey} from '../../../shared/partition'
import type {PartitionKey} from '../../../shared/types/2d'
import type {Delta} from '../../../shared/types/field'
import type {PartitionUpdate} from '../../../shared/types/message'
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
  await batchAllSettled(
    partitionKeys.map(partitionKey => {
      const deltas = partitionMap[partitionKey]!
      const message: Omit<PartitionUpdate, 'type'> = {
        partitionKey,
        sequenceNumber: 0,
        // TODO: Encode in a fancy way
        deltas,
      }
      return ctx.realtime.send('partition_update', message)
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

async function batchAllSettled<T>(
  promises: Array<Promise<T>>,
  batchSize: number = 50,
): Promise<Array<PromiseSettledResult<T>>> {
  // If the array is empty or batch size is invalid, return empty array or handle accordingly
  if (!promises.length || batchSize <= 0) {
    return []
  }

  // Calculate how many batches we'll need
  const batchCount = Math.ceil(promises.length / batchSize)
  const results: Array<PromiseSettledResult<T>> = []

  // Process each batch sequentially
  for (let i = 0; i < batchCount; i++) {
    const startIndex = i * batchSize
    const endIndex = Math.min(startIndex + batchSize, promises.length)
    const batch = promises.slice(startIndex, endIndex)

    // Process the current batch and add its results to our array
    const batchResults = await Promise.allSettled(batch)
    results.push(...batchResults)

    // Add a little delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}
