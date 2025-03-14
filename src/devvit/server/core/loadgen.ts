import type {JobContext} from '@devvit/public-api'
import {USER_IDS} from '../../../shared/test-utils'
import {T2} from '../../../shared/types/tid.js'
import {challengeConfigGet} from './challenge.ts'
import {fieldClaimCells} from './field.ts'

export type ClaimResult = ReturnType<typeof fieldClaimCells>

export async function generateClaim(
  ctx: JobContext,
  challengeNumber: number,
): Promise<ClaimResult> {
  const challenge = await challengeConfigGet({
    challengeNumber,
    subredditId: ctx.subredditId,
    redis: ctx.redis,
  })

  const x = getRandomIntBetween(0, challenge.size)
  const y = getRandomIntBetween(0, challenge.size)

  if (!ctx.userId) {
    const values = Object.values(USER_IDS)
    const idx = Math.floor(Math.random() * values.length)
    ctx.userId = values[idx]!
  }

  return await fieldClaimCells({
    coords: [{x, y}],
    challengeNumber,
    ctx,
    userId: T2(ctx.userId),
  })
}

/** Returns whole numbers in [min, max). */
function getRandomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min)
}
