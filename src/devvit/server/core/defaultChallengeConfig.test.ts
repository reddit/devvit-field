import {expect} from 'vitest'
import type {DefaultChallengeConfig} from '../../../shared/types/challenge-config'
import {DevvitTest} from './_utils/DevvitTest'
import {
  defaultChallengeConfigMaybeGet,
  defaultChallengeConfigSet,
} from './defaultChallengeConfig'

DevvitTest.it(
  'defaultChallengeConfigSet/Get - sets and gets a default challenge config',
  async ctx => {
    const config: DefaultChallengeConfig = {
      size: 15,
      partitionSize: 5,
      mineDensity: 8,
    }
    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config,
    })

    const retrievedConfig = await defaultChallengeConfigMaybeGet({
      redis: ctx.redis,
    })
    expect(retrievedConfig).toStrictEqual(config)
  },
)

DevvitTest.it(
  'defaultChallengeConfigMaybeGet - returns undefined when no config exists',
  async ctx => {
    const result = await defaultChallengeConfigMaybeGet({
      redis: ctx.redis,
    })
    expect(result).toBeUndefined()
  },
)

DevvitTest.it(
  'defaultChallengeConfigSet - updates existing config',
  async ctx => {
    const initialConfig: DefaultChallengeConfig = {
      size: 10,
      partitionSize: 5,
      mineDensity: 2,
    }
    const updatedConfig: DefaultChallengeConfig = {
      size: 20,
      partitionSize: 10,
      mineDensity: 5,
    }

    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: initialConfig,
    })
    await expect(
      defaultChallengeConfigMaybeGet({
        redis: ctx.redis,
      }),
    ).resolves.toStrictEqual(initialConfig)

    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: updatedConfig,
    })
    await expect(
      defaultChallengeConfigMaybeGet({
        redis: ctx.redis,
      }),
    ).resolves.toStrictEqual(updatedConfig)
  },
)

DevvitTest.it(
  'validates form values before saving default config',
  async ctx => {
    const invalidSize: DefaultChallengeConfig = {
      size: 0,
      partitionSize: 1,
      mineDensity: 2,
    }
    const invalidPartitionSize: DefaultChallengeConfig = {
      size: 10,
      partitionSize: 0,
      mineDensity: 2,
    }
    const invalidMineDensity: DefaultChallengeConfig = {
      size: 10,
      partitionSize: 2,
      mineDensity: 500,
    }
    const partitionSizeTooLarge: DefaultChallengeConfig = {
      size: 10,
      partitionSize: 20,
      mineDensity: 2,
    }
    const partitionSizeNotDivisible: DefaultChallengeConfig = {
      size: 10,
      partitionSize: 7,
      mineDensity: 2,
    }
    const fieldAreaTooLarge: DefaultChallengeConfig = {
      size: 3300,
      partitionSize: 1650,
      mineDensity: 2,
    }

    await expect(() =>
      defaultChallengeConfigSet({
        redis: ctx.redis,
        config: invalidSize,
      }),
    ).rejects.toThrow('Size must be greater than 0')
    await expect(() =>
      defaultChallengeConfigSet({
        redis: ctx.redis,
        config: invalidPartitionSize,
      }),
    ).rejects.toThrow('Partition size must be greater than 0')
    await expect(() =>
      defaultChallengeConfigSet({
        redis: ctx.redis,
        config: partitionSizeTooLarge,
      }),
    ).rejects.toThrow('Partition size must be less than or equal to size')
    await expect(() =>
      defaultChallengeConfigSet({
        redis: ctx.redis,
        config: partitionSizeNotDivisible,
      }),
    ).rejects.toThrow(
      `Size ${partitionSizeNotDivisible.size} must be divisible by partitionSize ${partitionSizeNotDivisible.partitionSize}`,
    )
    await expect(() =>
      defaultChallengeConfigSet({
        redis: ctx.redis,
        config: invalidMineDensity,
      }),
    ).rejects.toThrow('Mine density must be between 0 and 100')
    await expect(() =>
      defaultChallengeConfigSet({
        redis: ctx.redis,
        config: fieldAreaTooLarge,
      }),
    ).rejects.toThrow('Partition size must be less than or equal to 1448')
  },
)
