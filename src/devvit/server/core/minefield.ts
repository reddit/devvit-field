import type {Devvit} from '@devvit/public-api'
import {type PostSeed, PostSeedFromNothing} from '../../../shared/save'

const minefieldKey = 'minefield'

export const minefieldGet = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<PostSeed> => {
  const minefield = await redis.hGet(minefieldKey, challengeNumber.toString())

  if (!minefield) {
    throw new Error('No minefield found')
  }

  return JSON.parse(minefield)
}

export const minefieldSet = async ({
  redis,
  challengeNumber,
  minefield,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
  minefield: PostSeed
}): Promise<void> => {
  await redis.hSet(minefieldKey, {
    [challengeNumber.toString()]: JSON.stringify(minefield),
  })
}

export const minefieldCreate = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<void> => {
  const minefield = PostSeedFromNothing()

  await redis.hSet(minefieldKey, {
    [challengeNumber.toString()]: JSON.stringify(minefield),
  })
}
