// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'
import {makeRandomSeed} from '../../../shared/save'
import type {Seed} from '../../../shared/types/random'
import {Preview} from '../../components/preview'
import type {NewDevvitContext} from './_utils/NewDevvitContext'
import {setChallengeNumberForPost} from './challengeToPost'

const currentChallengeNumberKey = 'current_challenge_number'

type ChallengeMeta = {
  cols: number
  rows: number
  seed: Seed
  /** Number between 0 and 1 */
  density: number
}

const createChallengeMetaKey = (challengeNumber: number) =>
  `${challengeNumber}:field:meta` as const

export const challengeMetaGet = async ({
  redis,
  challengeNumber,
}: {
  redis: NewDevvitContext['redis']
  challengeNumber: number
}): Promise<ChallengeMeta> => {
  const meta = await redis.get(createChallengeMetaKey(challengeNumber))
  if (!meta) {
    throw new Error('No field found')
  }
  // TODO: Is this expensive and would a hash be better?
  return JSON.parse(meta)
}

export const challengeMetaSet = async ({
  redis,
  challengeNumber,
  meta,
}: {
  redis: NewDevvitContext['redis']
  challengeNumber: number
  meta?: Partial<ChallengeMeta> | undefined
}): Promise<void> => {
  await redis.set(
    createChallengeMetaKey(challengeNumber),
    JSON.stringify({
      cols: 10,
      rows: 10,
      seed: makeRandomSeed(),
      density: 0.02,
      ...meta,
    }),
  )
}

export const challengeMaybeGetCurrentChallengeNumber = async ({
  redis,
}: {redis: Devvit.Context['redis']}): Promise<number | undefined> => {
  const currentChallengeNumber = await redis.get(currentChallengeNumberKey)

  if (!currentChallengeNumber) {
    return undefined
  }

  const parsed = parseInt(currentChallengeNumber, 10)

  if (Number.isNaN(parsed)) {
    throw new Error('Invalid current challenge number')
  }

  return parsed
}

export const challengeGetCurrentChallengeNumber = async ({
  redis,
}: {redis: Devvit.Context['redis']}): Promise<number> => {
  const val = await challengeMaybeGetCurrentChallengeNumber({redis})

  if (val === undefined) {
    throw new Error('No current challenge number')
  }

  return val
}

export const challengeIncrementCurrentChallengeNumber = async ({
  redis,
}: {redis: Devvit.Context['redis']}): Promise<number> => {
  return await redis.incrBy(currentChallengeNumberKey, 1)
}

export const challengeSetCurrentChallengeNumber = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<void> => {
  await redis.set(currentChallengeNumberKey, challengeNumber.toString())
}

export const challengeMakeNew = async ({
  ctx,
  meta,
}: {
  ctx: NewDevvitContext
  meta?: Partial<ChallengeMeta>
}): Promise<{postID: string; url: string}> => {
  if (!ctx.subredditName) {
    throw new Error('No subreddit name')
  }

  const newChallengeNumber = await challengeIncrementCurrentChallengeNumber({
    redis: ctx.redis,
  })

  await challengeMetaSet({
    redis: ctx.redis,
    challengeNumber: newChallengeNumber,
    meta,
  })

  const post = await ctx.reddit.submitPost({
    preview: <Preview />,
    subredditName: ctx.subredditName,
    title: `Banfield #${newChallengeNumber}`,
  })

  await setChallengeNumberForPost({
    challengeNumber: newChallengeNumber,
    postId: post.id,
    redis: ctx.redis,
  })

  return {postID: post.id, url: post.url}
}

/** Inits keys needed in redis for the rest of the system to work */
export const challengeOnInstall = async ({
  redis,
}: {redis: Devvit.Context['redis']}): Promise<void> => {
  const result = await redis.get(currentChallengeNumberKey)
  if (!result) {
    await redis.set(currentChallengeNumberKey, '0')
  }
}
