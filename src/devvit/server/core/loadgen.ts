import type {JobContext} from '@devvit/public-api'
import {USER_IDS} from '../../../shared/test-utils'
import {T2} from '../../../shared/types/tid.js'
import {challengeConfigGet} from './challenge.ts'
import {fieldClaimCells} from './field.ts'

export type ClaimResult = {
  currentChallenge: number
  claim: Awaited<ReturnType<typeof fieldClaimCells>>
}

const strideKey = 'driveLoad:stride'

export async function generateClaim(
  ctx: JobContext,
  challengeNumber: number,
  stride: boolean = false,
): Promise<ClaimResult> {
  const challenge = await challengeConfigGet({
    challengeNumber,
    subredditId: ctx.subredditId,
    redis: ctx.redis,
  })

  let x: number
  let y: number

  if (stride) {
    const next = await ctx.redis.incrBy(strideKey, 1)
    x = next % challenge.size
    y = Math.floor(next / challenge.size) % challenge.size
  } else {
    x = getRandomIntBetween(0, challenge.size)
    y = getRandomIntBetween(0, challenge.size)
  }

  if (!ctx.userId) {
    const values = Object.values(USER_IDS)
    const idx = Math.floor(Math.random() * values.length)
    ctx.userId = values[idx]!
  }

  const claim = await fieldClaimCells({
    coords: [{x, y}],
    challengeNumber,
    ctx,
    userId: T2(ctx.userId),
  })
  return {
    currentChallenge: challengeNumber,
    claim,
  }
}

/** Returns whole numbers in [min, max). */
function getRandomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min)
}
