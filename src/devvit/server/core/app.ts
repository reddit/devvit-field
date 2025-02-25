import type {Devvit} from '@devvit/public-api'
import {getPartitionCoords} from '../../../shared/partition'
import type {XY} from '../../../shared/types/2d'
import type {LevelConfig} from '../../../shared/types/level'
import type {DialogMessage} from '../../../shared/types/message'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  makeSafeChallengeConfig,
} from './challenge'
import {fieldGetDeltas, fieldValidateUserAndAttemptAscend} from './field'
import {teamStatsCellsClaimedGet} from './leaderboards/challenge/team.cellsClaimed'
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
      initialCellsClaimed: Awaited<ReturnType<typeof teamStatsCellsClaimedGet>>
      initialGlobalXY: XY
      visible: number
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

  const [challengeConfig, initialCellsClaimed] = await Promise.all([
    challengeConfigGet({
      redis: ctx.redis,
      challengeNumber,
    }),
    teamStatsCellsClaimedGet({
      challengeNumber,
      redis: ctx.redis,
      sort: 'DESC',
    }),
  ])

  const initialGlobalXY: XY = {
    x: Math.trunc(Math.random() * challengeConfig.size),
    y: Math.trunc(Math.random() * challengeConfig.size),
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

  const totalCellsForField = challengeConfig.size * challengeConfig.size
  const totalCellsClaimed = initialCellsClaimed.reduce(
    (acc, {score}) => acc + score,
    0,
  )
  const visible = totalCellsClaimed - totalCellsForField

  return {
    pass: true,
    challengeNumber,
    profile,
    // DO NOT RETURN THE SEED
    challengeConfig: makeSafeChallengeConfig(challengeConfig),
    initialGlobalXY,
    initialDeltas: deltas,
    initialCellsClaimed,
    visible,
    level,
  }
}
