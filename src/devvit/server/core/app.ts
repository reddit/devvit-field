import type {Devvit} from '@devvit/public-api'
import {getPartitionCoords} from '../../../shared/partition'
import {type Team, getTeamFromUserId} from '../../../shared/team'
import type {XY} from '../../../shared/types/2d'
import type {LevelConfig} from '../../../shared/types/level'
import type {DialogMessage} from '../../../shared/types/message'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  makeSafeChallengeConfig,
} from './challenge'
import {fieldGetDeltas} from './field'
import {teamStatsCellsClaimedGet} from './leaderboards/challenge/team.cellsClaimed'
import {teamStatsMinesHitGet} from './leaderboards/challenge/team.minesHit'
import {levels, levelsIsUserInRightPlace} from './levels'
import {liveSettingsGet} from './live-settings'
import {userGetOrSet} from './user'

export type AppState =
  /** Continue rendering the app as usual */
  | {
      status: 'pass'
      appConfig: Awaited<ReturnType<typeof liveSettingsGet>>
      challengeNumber: Awaited<
        ReturnType<typeof challengeGetCurrentChallengeNumber>
      >
      challengeConfig: Awaited<ReturnType<typeof makeSafeChallengeConfig>>
      profile: Awaited<ReturnType<typeof userGetOrSet>>
      initialDeltas: Awaited<ReturnType<typeof fieldGetDeltas>>
      initialCellsClaimed: Awaited<ReturnType<typeof teamStatsCellsClaimedGet>>
      minesHitByTeam: Awaited<ReturnType<typeof teamStatsMinesHitGet>>
      initialGlobalXY: XY
      visible: number
      level: LevelConfig
      team: Team
    }
  /** Show a dialog inside of the webview */
  | ({
      status: 'dialog'
      profile: Awaited<ReturnType<typeof userGetOrSet>>
    } & Omit<DialogMessage, 'type'>)
  /** User has to verify email  */
  | {
      status: 'needsToVerifyEmail'
    }
  /** User is not allowed to see the page */
  | {
      status: 'notAllowed'
    }

export const appInitState = async (ctx: Devvit.Context): Promise<AppState> => {
  const [appConfig, profile, challengeNumber] = await Promise.all([
    liveSettingsGet(ctx),
    userGetOrSet({ctx}),
    challengeGetCurrentChallengeNumber({redis: ctx.redis}),
  ])

  if (profile.blocked) {
    return {status: 'notAllowed'}
  }

  if (profile.hasVerifiedEmail === false) {
    return {status: 'needsToVerifyEmail'}
  }

  const result = await levelsIsUserInRightPlace({
    ctx,
    profile,
  })
  if (result.pass === false) {
    const {pass: _pass, ...rest} = result
    return {status: 'dialog', ...rest, profile}
  }

  const [challengeConfig, initialCellsClaimed, minesHitByTeam] =
    await Promise.all([
      challengeConfigGet({
        redis: ctx.redis,
        subredditId: ctx.subredditId,
        challengeNumber,
      }),
      teamStatsCellsClaimedGet({
        challengeNumber,
        redis: ctx.redis,
        sort: 'DESC',
      }),
      teamStatsMinesHitGet({
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
    subredditId: ctx.subredditId,
    redis: ctx.redis,
    partitionXY: getPartitionCoords(
      initialGlobalXY,
      challengeConfig.partitionSize,
    ),
  })

  const level = levels.find(x => x.id === profile.currentLevel)!

  const totalCellsForField = challengeConfig.size * challengeConfig.size
  const totalCellsClaimed = initialCellsClaimed.reduce(
    (acc, {score}) => acc + score,
    0,
  )
  const visible = totalCellsForField - totalCellsClaimed

  return {
    status: 'pass',
    appConfig,
    challengeNumber,
    profile,
    // DO NOT RETURN THE SEED
    challengeConfig: makeSafeChallengeConfig(challengeConfig),
    initialGlobalXY,
    initialDeltas: deltas,
    initialCellsClaimed,
    visible,
    level,
    minesHitByTeam,
    team: getTeamFromUserId(profile.t2),
  }
}
