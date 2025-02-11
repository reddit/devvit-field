// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'
import {makeRandomSeed} from '../../../shared/save'
import type {Seed} from '../../../shared/types/random'
import {Preview} from '../../components/preview'
import type {NewDevvitContext} from './_utils/NewDevvitContext'
import {setChallengeNumberForPost} from './challengeToPost'

const currentChallengeNumberKey = 'current_challenge_number'

type ChallengeConfig = {
  /** The length of a side of the field. We assume it is always a perfect square. */
  size: number
  /**
   * The length of a size of a partition. Must be perfectly divisible into the size of the field.
   *
   * Set the partition size to the same number as the size to have no partition.
   */
  partitionSize: number
  /**
   * DO NOT EXPOSE THIS TO THE CLIENT. THIS IS BACKEND ONLY!!
   *
   * A random number that determines key aspects of the game like which cells are mines.
   */
  seed: Seed
  /**
   * DO NOT EXPOSE THIS TO THE CLIENT. THIS IS BACKEND ONLY!!
   *
   * Number between 0 and 100.
   *
   * 0: No mines
   * 100: Only mines
   *
   * Why an int over a float? Because things like incrBy are only for ints. At the moment,
   * I don't think we want to dynamically change the density of the field, but who's to
   * say it wouldn't be a fun feature if needed.
   */
  density: number
  // TODO: Theme variables and other config that we want to change per sub
}

const createChallengeConfigKey = (challengeNumber: number) =>
  `challenge:${challengeNumber}:config` as const

const makeDefaultChallengeConfig = (): ChallengeConfig => ({
  size: 10,
  partitionSize: 5,
  seed: makeRandomSeed(),
  density: 2,
})

export const challengeConfigGet = async ({
  redis,
  challengeNumber,
}: {
  redis: NewDevvitContext['redis']
  challengeNumber: number
}): Promise<ChallengeConfig> => {
  const config = await redis.hGetAll(createChallengeConfigKey(challengeNumber))
  if (Object.keys(config).length === 0) {
    throw new Error(
      `No challenge config for challengeNumber: ${challengeNumber}`,
    )
  }
  return deserializeChallengeConfig(config)
}

export const challengeConfigGetClientSafeProps = async ({
  redis,
  challengeNumber,
}: {
  redis: NewDevvitContext['redis']
  challengeNumber: number
}): Promise<ChallengeConfig> => {
  const {partitionSize, size} = await challengeConfigGet({
    redis,
    challengeNumber,
  })
  return {
    partitionSize,
    size,
  }
}

/**
 * Only meant to be used internally because you could mess up the game by setting the incorrect
 * partition size or changing the size in the middle of the game. If you need to allow changing
 * the config, produce functions specifically for your use case.
 */
const _challengeConfigSet = async ({
  redis,
  challengeNumber,
  config,
}: {
  redis: NewDevvitContext['redis']
  challengeNumber: number
  config: Partial<ChallengeConfig>
}): Promise<void> => {
  await redis.hSet(
    createChallengeConfigKey(challengeNumber),
    serializeChallengeConfig(config),
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
  config: configParams,
}: {
  ctx: NewDevvitContext
  config?: Partial<ChallengeConfig>
}): Promise<{postID: string; url: string; challengeNumber: number}> => {
  if (!ctx.subredditName) {
    throw new Error('No subreddit name')
  }

  const newChallengeNumber = await challengeIncrementCurrentChallengeNumber({
    redis: ctx.redis,
  })

  const config = {
    ...makeDefaultChallengeConfig(),
    ...configParams,
  }

  if (config.size % config.partitionSize !== 0) {
    throw new Error(
      `Size ${config.size} must be divisible by partitionSize ${config.partitionSize}`,
    )
  }

  await _challengeConfigSet({
    redis: ctx.redis,
    challengeNumber: newChallengeNumber,
    config,
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

  return {postID: post.id, url: post.url, challengeNumber: newChallengeNumber}
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

function serializeChallengeConfig(
  config: Partial<ChallengeConfig>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      return [key, value.toString()]
    }),
  )
}

function deserializeChallengeConfig(
  config: Record<string, string>,
): ChallengeConfig {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      let val

      const numberKeys: (keyof ChallengeConfig)[] = [
        'size',
        'density',
        'partitionSize',
        'seed',
      ]
      if (numberKeys.includes(key as keyof ChallengeConfig)) {
        val = parseFloat(value)
        if (Number.isNaN(val)) {
          throw new Error(`Invalid number for key: ${key}`)
        }
        return [key, val]
      }

      return [key, val]
    }),
  ) as ChallengeConfig
}
