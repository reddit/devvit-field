// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'
import {Preview} from '../../components/preview'
import {setChallengeNumberForPost} from './challengeToPost'
import {minefieldCreate} from './minefield'

const currentChallengeNumberKey = 'current_challenge_number'

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
}: {
  ctx: Devvit.Context
}): Promise<{postID: string; url: string}> => {
  if (!ctx.subredditName) {
    throw new Error('No subreddit name')
  }

  const newChallengeNumber = await challengeIncrementCurrentChallengeNumber({
    redis: ctx.redis,
  })

  await minefieldCreate({
    challengeNumber: newChallengeNumber,
    redis: ctx.redis,
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
