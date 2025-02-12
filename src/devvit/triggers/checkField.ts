import {
  Devvit,
  type JSONObject,
  type ScheduledJobHandler,
} from '@devvit/public-api'
import {getPartitionCoords} from '../../shared/partition'
import {challengeMaybeGetCurrentChallengeNumber} from '../server/core/challenge'
import {challengeConfigGet} from '../server/core/challenge'
import {type Delta, deltasGet} from '../server/core/deltas'

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

  const deltas = await deltasGet({
    challengeNumber: currentChallengeNumber,
    redis: ctx.redis,
  })

  /**
   * Roll through all deltas and group them by partition
   */
  type PartitionKey = `px${number}_py${number}`
  const partitionMap: Record<PartitionKey, Delta[]> = {}

  for (const delta of deltas) {
    const partition = getPartitionCoords(delta.coord, config.partitionSize)
    const partitionKey =
      `px${partition.partitionX}_py${partition.partitionY}` as const

    partitionMap[partitionKey] = [...(partitionMap[partitionKey] || []), delta]
  }

  /**
   * Loop through all partitions and send the deltas as realtime messages
   */
  const partitionKeys = Object.keys(partitionMap) as PartitionKey[]
  for (const partitionKey of partitionKeys) {
    const deltas = partitionMap[partitionKey]!
    await ctx.realtime.send(
      `challenge_${currentChallengeNumber}_partition__${partitionKey}`,
      {
        // TODO: Encode in a fancy way
        deltas,
      },
    )
  }
}

Devvit.addSchedulerJob({
  name: 'FIELD_UPDATE',
  onRun,
})
