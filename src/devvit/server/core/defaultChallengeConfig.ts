// App level default config that is applied when a new round is started
// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'
import {
  type DefaultChallengeConfig,
  defaultChallengeConfigKey,
} from '../../../shared/types/challenge-config'
import {validateChallengeConfig} from '../../../shared/validateChallengeConfig'
import {validateFieldArea} from '../../../shared/validateFieldArea'

/**
 * Save default challenge config to redis (scoped per subreddit, not global)
 */
export const defaultChallengeConfigSet = async ({
  redis,
  config,
}: {
  redis: Devvit.Context['redis']
  config: DefaultChallengeConfig
}): Promise<void> => {
  try {
    validateChallengeConfig(config)
    validateFieldArea(config.size)
  } catch (error) {
    console.error(error)
    throw error
  }
  await redis.hSet(
    defaultChallengeConfigKey,
    serializeDefaultChallengeConfig(config),
  )
}

/** Get default challenge config (scoped per subreddit, not global) */
export const defaultChallengeConfigMaybeGet = async ({
  redis,
}: {
  redis: Devvit.Context['redis']
}): Promise<DefaultChallengeConfig | undefined> => {
  const config = await redis.hGetAll(defaultChallengeConfigKey)
  if (Object.keys(config).length === 0) {
    console.log('No default challenge config found')
    return undefined
  }
  return deserializeDefaultChallengeConfig(config)
}

/* serialize/deserialize functions - copied directly from './challenge.ts' */
function serializeDefaultChallengeConfig(
  config: Partial<DefaultChallengeConfig>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      return [key, value.toString()]
    }),
  )
}

function deserializeDefaultChallengeConfig(
  config: Record<string, string>,
): DefaultChallengeConfig {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      let val

      const numberKeys: (keyof DefaultChallengeConfig)[] = [
        'size',
        'mineDensity',
        'partitionSize',
      ]
      if (numberKeys.includes(key as keyof DefaultChallengeConfig)) {
        val = parseFloat(value)
        if (Number.isNaN(val)) {
          throw new Error(`Invalid number for key: ${key}`)
        }
        return [key, val]
      }

      return [key, val]
    }),
  ) as unknown as DefaultChallengeConfig
}
