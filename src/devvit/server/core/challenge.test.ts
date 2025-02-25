import {expect} from 'vitest'
import type {ChallengeConfig} from '../../../shared/types/challenge-config'
import {DevvitTest} from './_utils/DevvitTest'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  challengeIncrementCurrentChallengeNumber,
  challengeMakeNew,
  challengeOnInstall,
} from './challenge'
import {defaultChallengeConfigSet} from './defaultChallengeConfig'

DevvitTest.it(
  'current challenge number starts at 0 and increments',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    await expect(
      challengeGetCurrentChallengeNumber({redis: ctx.redis}),
    ).resolves.toEqual(0)

    await expect(
      challengeIncrementCurrentChallengeNumber({redis: ctx.redis}),
    ).resolves.toEqual(1)

    await expect(
      challengeGetCurrentChallengeNumber({redis: ctx.redis}),
    ).resolves.toEqual(1)
  },
)

DevvitTest.it(
  'challengeMakeNew - increments challenge number, config inits to defaults, can be overridden, and config deserializes correctly',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {mineDensity: 59},
    })

    await expect(
      challengeConfigGet({redis: ctx.redis, challengeNumber}),
    ).resolves.toEqual({
      size: expect.any(Number),
      partitionSize: expect.any(Number),
      mineDensity: 59,
      seed: expect.any(Number),
    } satisfies ChallengeConfig)
  },
)

DevvitTest.it(
  'challengeMakeNew - uses default config when available',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    // Set up a default config
    const defaultConfig = {
      size: 20,
      partitionSize: 4,
      mineDensity: 10,
    }

    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: defaultConfig,
    })

    // Create a new challenge without specifying config
    const {challengeNumber} = await challengeMakeNew({ctx})

    // Get the config for the challenge
    const challengeConfig = await challengeConfigGet({
      redis: ctx.redis,
      challengeNumber,
    })

    // Verify that the default config was used
    expect(challengeConfig.size).toEqual(defaultConfig.size)
    expect(challengeConfig.partitionSize).toEqual(defaultConfig.partitionSize)
    expect(challengeConfig.mineDensity).toEqual(defaultConfig.mineDensity)

    // Verify that it generated a new seed
    expect(challengeConfig.seed).toBeDefined()
  },
)

DevvitTest.it(
  'challengeMakeNew - uses hardcoded defaults when no config available',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    // Create a new challenge without specifying config and without setting defaults
    const {challengeNumber} = await challengeMakeNew({ctx})

    // Get the config for the challenge
    const challengeConfig = await challengeConfigGet({
      redis: ctx.redis,
      challengeNumber,
    })

    // Verify that the hardcoded defaults were used
    expect(challengeConfig.size).toEqual(10) // Default size
    expect(challengeConfig.partitionSize).toEqual(5) // Default partitionSize
    expect(challengeConfig.mineDensity).toEqual(2) // Default mineDensity

    // Verify that it generated a seed
    expect(challengeConfig.seed).toBeDefined()
  },
)
