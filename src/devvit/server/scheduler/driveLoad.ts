import {
  Devvit,
  type JSONObject,
  type JobContext,
  type ScheduledJobEvent,
} from '@devvit/public-api'
import {challengeGetCurrentChallengeNumber} from '../core/challenge.ts'
import {type ClaimResult, generateClaim} from '../core/loadgen.ts'

const maxClaimRps = 1000

Devvit.addSchedulerJob({
  name: 'DRIVE_LOAD',
  onRun,
})

type DriveLoadSettings = {
  'drive-load-claims-per-sec': number
}

async function onRun(
  _: ScheduledJobEvent<JSONObject | undefined>,
  ctx: JobContext,
): Promise<void> {
  const settings = await ctx.settings.getAll<DriveLoadSettings>()

  const claimRps = Math.min(settings['drive-load-claims-per-sec'], maxClaimRps)
  if (!claimRps) return

  const currentChallengeNumber = await challengeGetCurrentChallengeNumber({
    redis: ctx.redis,
  })
  if (!currentChallengeNumber) return

  // Spread load using a Poisson process. Assume we're running every second.
  console.log(`generating ${claimRps} requests across one second`)
  const start = performance.now()
  const promises: Promise<ClaimResult>[] = []
  for (let i = 0; i < claimRps; i++) {
    const nextArrivalMs = -Math.log(1 - Math.random()) / (claimRps / 1_000)
    await new Promise(resolve => setTimeout(resolve, nextArrivalMs))
    promises.push(generateClaim(ctx, currentChallengeNumber))
  }
  const results = await Promise.all(promises)
  console.log(
    `completed ${claimRps} requests in ${(performance.now() - start) / 1_000} seconds`,
  )

  let numDeltas = 0
  let numNewLevels = 0
  for (const {claimedCells, newLevel} of results) {
    if (claimedCells.length) numDeltas++
    if (newLevel) numNewLevels++
  }
  console.log(`numDeltas=${numDeltas}, numNewLevels=${numNewLevels}`)
}
