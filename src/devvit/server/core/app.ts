import type {Devvit} from '@devvit/public-api'
import {didUserBeatTheGame} from '../../../shared/beatTheGame'
import {getPartitionCoords} from '../../../shared/partition'
import {
  type Team,
  fillAndSortByTeamNumber,
  getTeamFromUserId,
} from '../../../shared/team'
import type {XY} from '../../../shared/types/2d'
import {type LevelConfig, config2} from '../../../shared/types/level'
import type {DialogMessage, TeamBoxCounts} from '../../../shared/types/message'
import {activePlayersIncrement} from './activePlayers'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  makeSafeChallengeConfig,
} from './challenge'
import {fieldGetPartitionMapLatestSnapshotKey} from './field'
import {teamStatsCellsClaimedGetTotal} from './leaderboards/challenge/team.cellsClaimed'
import {teamStatsMinesHitGet} from './leaderboards/challenge/team.minesHit'
import {leaderboardGet} from './leaderboards/global/leaderboard'
import {levelsIsUserInRightPlace} from './levels'
import {liveSettingsGet} from './live-settings'
import {getPathPrefix} from './s3'
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
      initialMapKey: Awaited<
        ReturnType<typeof fieldGetPartitionMapLatestSnapshotKey>
      >
      initialCellsClaimed: Awaited<
        ReturnType<typeof teamStatsCellsClaimedGetTotal>
      >
      minesHitByTeam: Awaited<ReturnType<typeof teamStatsMinesHitGet>>
      globalStandings: TeamBoxCounts
      initialGlobalXY: XY
      visible: number
      level: LevelConfig
      team: Team
    }
  /** Show a dialog inside of the webview */
  | ({
      status: 'dialog'
      profile: Awaited<ReturnType<typeof userGetOrSet>>
    } & DialogMessage)
  /** User has to verify email  */
  | {
      status: 'needsToVerifyEmail'
    }
  /** User is not allowed to see the page */
  | {
      status: 'notAllowed'
    }
  | {
      status: 'beatTheGame'
    }

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min)) + min

export function getStartingCoordForTeam(size: number, team: Team): XY {
  const midX = Math.floor(size / 2)
  const midY = Math.floor(size / 2)

  const regions = [
    {x: [0, midX], y: [0, midY]}, // Top-left
    {x: [midX, size], y: [0, midY]}, // Top-right
    {x: [0, midX], y: [midY, size]}, // Bottom-left
    {x: [midX, size], y: [midY, size]}, // Bottom-right
  ] as const

  const teamRegion = regions[team]

  return {
    x: randomBetween(teamRegion.x[0], teamRegion.x[1]),
    y: randomBetween(teamRegion.y[0], teamRegion.y[1]),
  }
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

  if (didUserBeatTheGame(profile)) {
    return {status: 'beatTheGame'}
  }

  const result = await levelsIsUserInRightPlace({
    ctx,
    profile,
  })
  if (result.pass === false) {
    const {pass: _pass, ...rest} = result
    return {status: 'dialog', ...rest, profile}
  }

  const [
    challengeConfig,
    initialCellsClaimed,
    minesHitByTeam,
    globalStandings,
  ] = await Promise.all([
    challengeConfigGet({
      redis: ctx.redis,
      subredditId: ctx.subredditId,
      challengeNumber,
    }),
    teamStatsCellsClaimedGetTotal(ctx.redis, challengeNumber, 'DESC'),
    teamStatsMinesHitGet({
      challengeNumber,
      redis: ctx.redis,
      sort: 'DESC',
    }),
    leaderboardGet({redis: ctx.redis, sort: 'DESC'}),
  ])

  const initialGlobalXY: XY = getStartingCoordForTeam(
    challengeConfig.size,
    getTeamFromUserId(profile.t2),
  )

  const pathPrefix = await getPathPrefix(ctx.settings)
  const mapKey = await fieldGetPartitionMapLatestSnapshotKey(
    ctx.redis,
    pathPrefix,
    ctx.subredditId,
    challengeNumber,
    getPartitionCoords(initialGlobalXY, challengeConfig.partitionSize),
  )

  const level = config2.levels.find(x => x.id === profile.currentLevel)!

  const totalCellsForField = challengeConfig.size * challengeConfig.size
  const totalCellsClaimed = initialCellsClaimed.reduce(
    (acc, {score}) => acc + score,
    0,
  )
  const visible = totalCellsForField - totalCellsClaimed

  const team = getTeamFromUserId(profile.t2)

  // TODO: Only call on initial init?
  await activePlayersIncrement({
    redis: ctx.redis,
    // TODO: Get from app state after jasmine's PR
    team,
  })

  return {
    status: 'pass',
    appConfig,
    challengeNumber,
    profile,
    // DO NOT RETURN THE SEED
    challengeConfig: makeSafeChallengeConfig(challengeConfig),
    initialGlobalXY,
    initialMapKey: mapKey,
    initialCellsClaimed: fillAndSortByTeamNumber(initialCellsClaimed),
    visible,
    level,
    minesHitByTeam,
    globalStandings: fillAndSortByTeamNumber(globalStandings).map(
      x => x.score,
    ) as TeamBoxCounts,
    team,
  }
}
