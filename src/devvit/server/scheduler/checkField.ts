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
import {deltasGet} from '../core/deltas'

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
  for (const partitionKey of partitionKeys) {
    const deltas = partitionMap[partitionKey]!
    // to-do: Promise.all() or Promise.allSettled(). Plugin time actually counts
    //        against apps.
    // [remote] 2025-02-23T16:46:56.040Z Error: 2 UNKNOWN: failed to send realtime event for app: banfieldoid Post "https://gql-rt.reddit.com/query": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
    //     at callErrorFromStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksTransformer.js:25:16)
    //     at Object.onReceiveStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksReconciler.js:153:43)
    //     at Object.onReceiveStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksTransformer.js:533:4)
    //     at Object.onReceiveStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksTransformer.js:498:52)
    //     at <unknown> (src/devvit/components/app.tsx:179:2)
    //     at process.processTicksAndRejections (node_modules/kind-of/index.js:46:25)
    // for call at
    //     at Client2.makeUnaryRequest (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksReconciler.js:123:9)
    //     at /srv/index.cjs:133536:62
    //     at /srv/index.cjs:133595:5
    //     at new Promise (<anonymous>)
    //     at GrpcWrapper._GrpcWrapper_promiseWithGrpcCallback2 (/srv/index.cjs:133593:10)
    //     at GrpcWrapper.request (/srv/index.cjs:133535:110)
    //     at GenericPluginClient.Send (/srv/index.cjs:119137:93)
    //     at wrapped.<computed> [as Send] (node_modules/@devvit/public-api/devvit/Devvit.js:287:140)
    //     at RealtimeClient.send (node_modules/@devvit/public-api/apis/realtime/RealtimeClient.js:21:36)
    //     at onRun (src/devvit/server/scheduler/checkField.ts:50:23) {
    //   cause: [Error: 2 UNKNOWN: failed to send realtime event for app: banfieldoid Post "https://gql-rt.reddit.com/query": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)] {
    //     code: 2,
    //     details: 'failed to send realtime event for app: banfieldoid Post "https://gql-rt.reddit.com/query": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)',
    //     metadata: _Metadata { internalRepr: Map(0) {}, options: {} }
    //   }
    // }
    // [remote] 2025-02-23T16:47:43.338Z Error: 16 UNAUTHENTICATED: failed to authenticate plugin request; upstream request missing or timed out
    //     at callErrorFromStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksTransformer.js:25:16)
    //     at Object.onReceiveStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksReconciler.js:153:43)
    //     at Object.onReceiveStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksTransformer.js:533:4)
    //     at Object.onReceiveStatus (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksTransformer.js:498:52)
    //     at <unknown> (src/devvit/components/app.tsx:175:2)
    //     at process.processTicksAndRejections (node_modules/kind-of/index.js:46:25)
    // for call at
    //     at Client2.makeUnaryRequest (node_modules/@devvit/public-api/devvit/internals/blocks/BlocksReconciler.js:123:9)
    //     at /srv/index.cjs:133536:62
    //     at /srv/index.cjs:133595:5
    //     at new Promise (<anonymous>)
    //     at GrpcWrapper._GrpcWrapper_promiseWithGrpcCallback2 (/srv/index.cjs:133593:10)
    //     at GrpcWrapper.request (/srv/index.cjs:133535:110)
    //     at GenericPluginClient.Send (/srv/index.cjs:119137:93)
    //     at wrapped.<computed> [as Send] (node_modules/@devvit/public-api/devvit/Devvit.js:287:140)
    //     at RealtimeClient.send (node_modules/@devvit/public-api/apis/realtime/RealtimeClient.js:21:36)
    //     at onRun (src/devvit/server/scheduler/checkField.ts:50:23) {
    //   cause: [Error: 16 UNAUTHENTICATED: failed to authenticate plugin request; upstream request missing or timed out] {
    //     code: 16,
    //     details: 'failed to authenticate plugin request; upstream request missing or timed out',
    //     metadata: _Metadata { internalRepr: Map(0) {}, options: {} }
    //   }
    // }
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
