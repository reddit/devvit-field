import {beforeEach, expect} from 'vitest'
import type {DefaultChallengeConfig} from '../../../shared/types/challenge-config'
import {DevvitTest} from './_utils/DevvitTest'
import {
  defaultChallengeConfigGet,
  defaultChallengeConfigSet,
} from './defaultChallengeConfig'

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
    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config,
    })

    const retrievedConfig = await defaultChallengeConfigGet({
      redis: ctx.redis,
    })
    expect(retrievedConfig).toEqual(config)
  },
)

DevvitTest.it(
  'defaultChallengeConfigGet - throws an error when no config exists',
  async ctx => {
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
    const initialConfig: DefaultChallengeConfig = {
      size: 10,
      partitionSize: 5,
      mineDensity: 2,
    }
    const updatedConfig: DefaultChallengeConfig = {
      size: 20,
      partitionSize: 4,
      mineDensity: 5,
    }

    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: initialConfig,
    })
    await expect(
      defaultChallengeConfigGet({
        redis: ctx.redis,
      }),
    ).resolves.toEqual(initialConfig)

    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: updatedConfig,
    })
    await expect(
      defaultChallengeConfigGet({
        redis: ctx.redis,
      }),
    ).resolves.toEqual(updatedConfig)
  },
)
