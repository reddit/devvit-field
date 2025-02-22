import type {Devvit} from '@devvit/public-api'
import {getPartitionCoords} from '../../../shared/partition'
import type {XY} from '../../../shared/types/2d'
import type {LevelConfig} from '../../../shared/types/level'
import type {DialogMessage} from '../../../shared/types/message'
import {Random} from '../../../shared/types/random'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  makeSafeChallengeConfig,
} from './challenge'
import {fieldGetDeltas, fieldValidateUserAndAttemptAscend} from './field'
import {levels} from './levels'
import {userGetOrSet} from './user'

export type AppState =
  | {
      pass: true
      challengeNumber: Awaited<
        ReturnType<typeof challengeGetCurrentChallengeNumber>
      >
      challengeConfig: Awaited<ReturnType<typeof makeSafeChallengeConfig>>
      profile: Awaited<ReturnType<typeof userGetOrSet>>
      initialDeltas: Awaited<ReturnType<typeof fieldGetDeltas>>
      initialGlobalXY: XY
      level: LevelConfig
    }
  | ({
      pass: false
    } & Omit<DialogMessage, 'type'>)

export const appInitState = async (ctx: Devvit.Context): Promise<AppState> => {
  const [profile, challengeNumber] = await Promise.all([
    userGetOrSet({ctx}),
    challengeGetCurrentChallengeNumber({redis: ctx.redis}),
  ])

  const result = await fieldValidateUserAndAttemptAscend({
    challengeNumber,
    ctx,
    profile,
  })
  if (result.pass === false) {
    return result
  }

  const challengeConfig = await challengeConfigGet({
    redis: ctx.redis,
    challengeNumber,
  })

  const rnd = new Random(challengeConfig.seed)
  const initialGlobalXY: XY = {
    x: Math.trunc(rnd.num * challengeConfig.size),
    y: Math.trunc(rnd.num * challengeConfig.size),
  }

  const deltas = await fieldGetDeltas({
    challengeNumber,
    redis: ctx.redis,
    partitionXY: getPartitionCoords(
      initialGlobalXY,
      challengeConfig.partitionSize,
    ),
  })

  const level = levels.find(x => x.id === profile.currentLevel)
  if (!level) {
    throw new Error(`No level found for ${profile.currentLevel}`)
  }

  return {
    pass: true,
    challengeNumber,
    profile,
    // DO NOT RETURN THE SEED
    challengeConfig: makeSafeChallengeConfig(challengeConfig),
    initialGlobalXY,
    initialDeltas: deltas,
    level,
  }
}
