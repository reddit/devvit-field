import {beforeEach, expect} from 'vitest'
import type {ChallengeConfig} from '../../../shared/types/challenge-config'
import {DevvitTest} from './_utils/DevvitTest'
import {
  challengeConfigClearCache,
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  challengeIncrementCurrentChallengeNumber,
  challengeMakeNew,
  challengeOnInstall,
  makeFallbackDefaultChallengeConfig,
} from './challenge'
import {defaultChallengeConfigSet} from './defaultChallengeConfig'

beforeEach(() => {
  challengeConfigClearCache()
})

DevvitTest.it(
  'current challenge number starts at 0 and increments',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    await expect(
      challengeGetCurrentChallengeNumber({redis: ctx.redis}),
    ).resolves.toStrictEqual(0)

    await expect(
      challengeIncrementCurrentChallengeNumber({redis: ctx.redis}),
    ).resolves.toStrictEqual(1)

    await expect(
      challengeGetCurrentChallengeNumber({redis: ctx.redis}),
    ).resolves.toStrictEqual(1)
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
      challengeConfigGet({
        redis: ctx.redis,
        challengeNumber,
        subredditId: 't5_0',
      }),
    ).resolves.toStrictEqual({
      size: expect.any(Number),
      partitionSize: expect.any(Number),
      mineDensity: 59,
      seed: expect.any(Number),
      totalNumberOfMines: expect.any(Number),
    } satisfies ChallengeConfig)
  },
)

DevvitTest.it(
  'challengeMakeNew - uses default config when available',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    const defaultConfig = {
      size: 20,
      partitionSize: 10,
      mineDensity: 10,
    }
    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: defaultConfig,
    })

    const {challengeNumber} = await challengeMakeNew({ctx})

    const challengeConfig = await challengeConfigGet({
      redis: ctx.redis,
      subredditId: ctx.subredditId,
      challengeNumber,
    })

    expect(challengeConfig.size).toStrictEqual(defaultConfig.size)
    expect(challengeConfig.partitionSize).toStrictEqual(
      defaultConfig.partitionSize,
    )
    expect(challengeConfig.mineDensity).toStrictEqual(defaultConfig.mineDensity)

    expect(challengeConfig.seed).toBeDefined()
  },
)

DevvitTest.it(
  'challengeMakeNew - uses hardcoded defaults when no default config available',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    const {challengeNumber} = await challengeMakeNew({ctx})
    const challengeConfig = await challengeConfigGet({
      redis: ctx.redis,
      subredditId: ctx.subredditId,
      challengeNumber,
    })

    expect(challengeConfig.size).toStrictEqual(
      makeFallbackDefaultChallengeConfig().size,
    )
    expect(challengeConfig.partitionSize).toStrictEqual(
      makeFallbackDefaultChallengeConfig().partitionSize,
    )
    expect(challengeConfig.mineDensity).toStrictEqual(
      makeFallbackDefaultChallengeConfig().mineDensity,
    )
    expect(challengeConfig.seed).toBeDefined()
  },
)

DevvitTest.it(
  'challengeMakeNew - mod-entered form values override default config values',
  async ctx => {
    await challengeOnInstall({redis: ctx.redis})

    const defaultConfig = {
      size: 20,
      partitionSize: 10,
      mineDensity: 10,
    }
    await defaultChallengeConfigSet({
      redis: ctx.redis,
      config: defaultConfig,
    })

    const modConfig = {
      size: 18,
      partitionSize: 9,
      mineDensity: 5,
    }

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: modConfig,
    })
    const challengeConfig = await challengeConfigGet({
      redis: ctx.redis,
      subredditId: ctx.subredditId,
      challengeNumber,
    })

    expect(challengeConfig.size).toStrictEqual(modConfig.size)
    expect(challengeConfig.partitionSize).toStrictEqual(modConfig.partitionSize)
    expect(challengeConfig.mineDensity).toStrictEqual(modConfig.mineDensity)
    expect(challengeConfig.seed).toBeDefined()
  },
)
