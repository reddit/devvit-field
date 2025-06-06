import {gauge} from '@devvit/metrics'
// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'
import {makeRandomSeed} from '../../../shared/save'
import {
  type ChallengeConfig,
  createChallengeConfigKey,
  currentChallengeNumberKey,
  currentChallengeStartTimeMillisKey,
} from '../../../shared/types/challenge-config'
import {validateChallengeConfig} from '../../../shared/validateChallengeConfig'
import {defaultChallengeConfigMaybeGet} from './defaultChallengeConfig'
import {globalStatsIncrement} from './globalStats'
import {teamStatsMinesHitInit} from './leaderboards/challenge/team.minesHit'
import {minefieldGetTotalMineCount} from './minefield'

const metrics = {
  size: gauge({
    name: 'challenge_config_size',
    labels: [],
  }),

  partitionSize: gauge({
    name: 'challenge_config_partition_size',
    labels: [],
  }),

  mineDensity: gauge({
    name: 'challenge_config_mine_density',
    labels: [],
  }),

  totalNumberOfMines: gauge({
    name: 'challenge_config_mine_total',
    labels: [],
  }),

  targetGameDurationSeconds: gauge({
    name: 'target_game_duration_seconds',
    labels: [],
  }),
}

/* Fallback config to be used if no default has been set through the subreddit menu action */
export const makeFallbackDefaultChallengeConfig = (): ChallengeConfig => {
  const seed = makeRandomSeed()
  const size = 10
  return {
    size,
    partitionSize: 5,
    seed: makeRandomSeed(),
    mineDensity: 2,
    totalNumberOfMines: minefieldGetTotalMineCount({
      seed,
      cols: size,
      rows: size,
    }),
    targetGameDurationSeconds: 0,
  }
}

// While it's a little inappropriate to be storing and reading things outside
// of the request context, this prevents a barrage of requests to redis for the
// same challenge config. One per actor node is very different than one per
// user interaction.
const challengeConfigCache: Record<string, ChallengeConfig> = {}

export const challengeConfigGet = async ({
  redis,
  subredditId,
  challengeNumber,
}: {
  redis: Devvit.Context['redis']
  subredditId: string
  challengeNumber: number
}): Promise<ChallengeConfig> => {
  const cacheKey = `${subredditId}:${challengeNumber}`
  if (challengeConfigCache[cacheKey]) {
    return challengeConfigCache[cacheKey]
  }

  const config = await redis.hGetAll(createChallengeConfigKey(challengeNumber))
  if (Object.keys(config).length === 0) {
    throw new Error(
      `No challenge config for challengeNumber: ${challengeNumber}`,
    )
  }
  const challengeConfig = deserializeChallengeConfig(config)
  challengeConfigCache[cacheKey] = challengeConfig
  metrics.size.labels().set(challengeConfig.size)
  metrics.partitionSize.labels().set(challengeConfig.partitionSize)
  metrics.mineDensity.labels().set(challengeConfig.mineDensity)
  metrics.totalNumberOfMines.labels().set(challengeConfig.totalNumberOfMines)
  if (challengeConfig.targetGameDurationSeconds) {
    metrics.targetGameDurationSeconds
      .labels()
      .set(challengeConfig.targetGameDurationSeconds)
  }
  return challengeConfig
}

/**
 * Clears the cache of challenge configs. Primarily used for testing.
 */
export const challengeConfigClearCache = (): void => {
  for (const key in challengeConfigCache) {
    delete challengeConfigCache[key]
  }
}

/**
 * Returns client safe properties to the client. Please don't put the seed here.
 */
export const makeSafeChallengeConfig = (
  config: ChallengeConfig,
): Pick<ChallengeConfig, 'size' | 'partitionSize' | 'totalNumberOfMines'> => {
  return {
    // DO NOT ADD SEED HERE
    size: config.size,
    partitionSize: config.partitionSize,
    totalNumberOfMines: config.totalNumberOfMines,
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
  const challengeNumber = await redis.incrBy(currentChallengeNumberKey, 1)
  await redis.set(currentChallengeStartTimeMillisKey, `${Date.now()}`)
  return challengeNumber
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
  ctx: Pick<Devvit.Context, 'redis' | 'subredditName'>
  config?: Partial<ChallengeConfig>
}): Promise<{challengeNumber: number}> => {
  if (!ctx.subredditName) {
    throw new Error('No subreddit name')
  }

  const config: ChallengeConfig = {
    ...makeFallbackDefaultChallengeConfig(),
    ...(await defaultChallengeConfigMaybeGet({
      redis: ctx.redis,
    })),
    ...configParams,
  }

  // Get the total number of mines after merging the configs
  config.totalNumberOfMines = minefieldGetTotalMineCount({
    seed: config.seed,
    cols: config.size,
    rows: config.size,
  })

  validateChallengeConfig(config)

  const newChallengeNumber = await challengeIncrementCurrentChallengeNumber({
    redis: ctx.redis,
  })

  await globalStatsIncrement({
    field: 'totalFields',
    redis: ctx.redis,
  })

  await _challengeConfigSet({
    redis: ctx.redis,
    challengeNumber: newChallengeNumber,
    config,
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
      if (value === undefined) {
        return [key, '']
      }

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
        'totalNumberOfMines',
        'targetGameDurationSeconds',
      ]
      if (numberKeys.includes(key as keyof ChallengeConfig)) {
        val = parseFloat(value)
        if (Number.isNaN(val)) {
          throw new Error(`Invalid number for key: ${key}`)
        }
        return [key, val]
      }

      return [key, value]
    }),
  ) as ChallengeConfig
}
