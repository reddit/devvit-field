import {expect} from 'vitest'
import {DevvitTest} from './_utils/DevvitTest'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  challengeIncrementCurrentChallengeNumber,
  challengeMakeNew,
  challengeOnInstall,
} from './challenge'

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
      config: {density: 59},
    })

    await expect(
      challengeConfigGet({redis: ctx.redis, challengeNumber}),
    ).resolves.toEqual({
      size: expect.any(Number),
      partitionSize: expect.any(Number),
      density: 59,
      seed: expect.any(Number),
    })
  },
)
