// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'
import {makeRandomSeed} from '../../../shared/save'
import {teamStatsCellsClaimedInit} from './leaderboards/challenge/team.cellsClaimed'
import {teamStatsMinesHitInit} from './leaderboards/challenge/team.minesHit'
import {
  createChallengeConfigKey,
  currentChallengeNumberKey,
  type ChallengeConfig,
  type DefaultChallengeConfig,
} from '../../../shared/types/challenge-config'
import {defaultChallengeConfigGet} from './defaultChallengeConfig'

const makeDefaultChallengeConfig = (): ChallengeConfig => ({
  size: 10,
  partitionSize: 5,
  seed: makeRandomSeed(),
  mineDensity: 2,
})

export const challengeConfigGet = async ({
  redis,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
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

/**
 * Returns client safe properties to the client. Please don't put the seed here.
 */
export const makeSafeChallengeConfig = (
  config: ChallengeConfig,
): Pick<ChallengeConfig, 'size' | 'partitionSize'> => {
  return {
    // DO NOT ADD SEED HERE
    size: config.size,
    partitionSize: config.partitionSize,
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
  redis: Devvit.Context['redis']
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

// Modified function to use default challenge config
export const challengeMakeNew = async ({
  ctx,
  config: configParams,
}: {
  ctx: Devvit.Context
  config?: Partial<ChallengeConfig>
}): Promise<{challengeNumber: number}> => {
  if (!ctx.subredditName) {
    throw new Error('No subreddit name')
  }

  const newChallengeNumber = await challengeIncrementCurrentChallengeNumber({
    redis: ctx.redis,
  })

  // Try to get default config
  let defaultConfig: DefaultChallengeConfig = makeDefaultChallengeConfig()
  try {
    defaultConfig = await defaultChallengeConfigGet({
      redis: ctx.redis,
    })
    console.log(`Using default config: ${JSON.stringify(defaultConfig)}`)
  } catch (error) {
    // If no default config exists, use the default hardcoded values
    console.log('No default config found, using hardcoded defaults')
  }

  // Combine defaults with any provided overrides
  const config = {
    ...defaultConfig,
    // Always generate a new seed for each challenge
    seed: makeRandomSeed(),
    // Allow explicit overrides from the function call
    ...configParams,
  }

  if (
    !Number.isInteger(config.size) ||
    !Number.isInteger(config.partitionSize) ||
    !Number.isInteger(config.mineDensity)
  ) {
    throw new Error('Size, partitionSize, and mineDensity must be integers')
  }

  if (config.size < 2) {
    throw new Error('Size must be greater than 1')
  }

  if (config.partitionSize < 1) {
    throw new Error('Partition size must be greater than 0')
  }

  if (config.partitionSize > config.size) {
    throw new Error('Partition size must be less than or equal to size')
  }

  if (config.mineDensity < 0 || config.mineDensity > 100) {
    throw new Error('Mine density must be between 0 and 100')
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

  await teamStatsCellsClaimedInit({
    challengeNumber: newChallengeNumber,
    redis: ctx.redis,
  })

  await teamStatsMinesHitInit({
    challengeNumber: newChallengeNumber,
    redis: ctx.redis,
  })

  return {challengeNumber: newChallengeNumber}
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
        'mineDensity',
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
  ) as unknown as ChallengeConfig
}
