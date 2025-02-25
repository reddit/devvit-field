import {beforeEach, expect} from 'vitest'
import {DevvitTest} from './_utils/DevvitTest'
import {
  defaultChallengeConfigGet,
  defaultChallengeConfigSet,
} from './defaultChallengeConfig'
import type {DefaultChallengeConfig} from '../../../shared/types/challenge-config'

beforeEach(() => {
  DevvitTest.resetRedis()
})

DevvitTest.it(
  'defaultChallengeConfigSet/Get - sets and gets a default challenge config',
  async ctx => {
    const config: DefaultChallengeConfig = {
      size: 15,
      partitionSize: 3,
      mineDensity: 8,
    }

    // Set the config
    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config,
    })

    // Get the config
    const retrievedConfig = await defaultChallengeConfigGet({
      redis: ctx.redis,
    })

    // Verify that the config was stored and retrieved correctly
    expect(retrievedConfig).toEqual(config)
  },
)

DevvitTest.it(
  'defaultChallengeConfigGet - throws an error when no config exists',
  async ctx => {
    // Try to get a config that doesn't exist
    await expect(
      defaultChallengeConfigGet({
        redis: ctx.redis,
      }),
    ).rejects.toThrow('No default challenge config')
  },
)

DevvitTest.it(
  'defaultChallengeConfigSet - updates existing config',
  async ctx => {
    // Initial config
    const initialConfig: DefaultChallengeConfig = {
      size: 10,
      partitionSize: 5,
      mineDensity: 2,
    }

    // Updated config
    const updatedConfig: DefaultChallengeConfig = {
      size: 20,
      partitionSize: 4,
      mineDensity: 5,
    }

    // Set the initial config
    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: initialConfig,
    })

    // Verify initial config
    await expect(
      defaultChallengeConfigGet({
        redis: ctx.redis,
      }),
    ).resolves.toEqual(initialConfig)

    // Update the config
    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: updatedConfig,
    })

    // Verify updated config
    await expect(
      defaultChallengeConfigGet({
        redis: ctx.redis,
      }),
    ).resolves.toEqual(updatedConfig)
  },
)
