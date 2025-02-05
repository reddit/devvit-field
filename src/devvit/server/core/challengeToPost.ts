import type {Devvit} from '@devvit/public-api'

const challengeToPostKey = 'challenge_to_original_post'

export const getChallengeNumberForPost = async ({
  redis,
  postId,
}: {
  redis: Devvit.Context['redis']
  postId: string
}): Promise<number> => {
  const challengeNumber = await redis.zScore(challengeToPostKey, postId)

  if (!challengeNumber) {
    throw new Error('No challenge number found')
  }

  return challengeNumber
}

export const getPostForChallengeNumber = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  challengeNumber: number
}): Promise<string> => {
  const posts = await redis.zRange(
    challengeToPostKey,
    challengeNumber,
    challengeNumber,
    {
      by: 'score',
    },
  )

  if (!posts || posts.length === 0) {
    throw new Error('No post found for challenge number')
  }

  if (posts.length !== 1) {
    throw new Error('Multiple posts found for the same challenge number')
  }

  return posts[0]!.member
}

export const setChallengeNumberForPost = async ({
  redis,
  postId,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  postId: string
  challengeNumber: number
}): Promise<void> => {
  await redis.zAdd(challengeToPostKey, {
    member: postId,
    score: challengeNumber,
  })
}
