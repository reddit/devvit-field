import {type Context, Devvit, useInterval, useState} from '@devvit/public-api'
import {didUserBeatTheGame} from '../../shared/beatTheGame.js'
import type {Profile} from '../../shared/save.js'
import {type Team, getTeamFromUserId} from '../../shared/team.js'
import {fallbackPixelRatio} from '../../shared/theme.js'
import {config2} from '../../shared/types/level.js'
import type {DialogMessage} from '../../shared/types/message.js'
import type {T2} from '../../shared/types/tid.js'
import {useState2} from '../hooks/use-state2.js'
import {globalStatsGet} from '../server/core/globalStats.js'
import {leaderboardGet} from '../server/core/leaderboards/global/leaderboard.js'
import {levelsIsUserInRightPlace} from '../server/core/levels.js'
import {
  userAttemptToClaimGlobalPointForTeam,
  userGetOrSet,
  userSetNewGamePlusIfNotExists,
} from '../server/core/user.js'
import {DialogBeatGame} from './DialogBeatGame.js'
import {DialogNotAllowed} from './DialogNotAllowed.js'
import {DialogUnauthorized} from './DialogUnauthorized.js'
import {DialogVerifyEmail} from './DialogVerifyEmail.js'
import {LeaderboardView} from './LeaderboardView.js'
import {PointClaimScreen} from './PointClaimScreen.js'

// The LeaderboardView has a detatched head to separate out the utilities
// not available to us in the preview state. Enabling us to reuse the template
// between the default and preview states.

type LeaderboardControllerProps = {
  pixelRatio: number
}

type LeaderboardControllerState =
  | {
      status: 'claimGlobalPoint'
      standings: {
        member: Team
        score: number
      }[]
      profile: Profile
      team: Team
    }
  | ({
      status: 'dialog'
      profile: Awaited<ReturnType<typeof userGetOrSet>>
    } & DialogMessage)
  | {
      status: 'beatTheGame'
    }
  | {
      status: 'notAllowed'
    }
  | {
      status: 'needsToVerifyEmail'
    }
  | {
      status: 'viewLeaderboard'
      standings: {
        member: Team
        score: number
      }[]
      profile: Profile | null
      globalStats: Awaited<ReturnType<typeof globalStatsGet>>
    }

export function LeaderboardController(
  props: LeaderboardControllerProps,
  context: Context,
): JSX.Element {
  const pixelRatio =
    context.uiEnvironment?.dimensions?.scale ?? fallbackPixelRatio

  const [forcePlayField, setForcePlayField] = useState(false)

  const [state, setState] = useState2<LeaderboardControllerState>(async () => {
    const [standings, globalStats, profile] = await Promise.all([
      leaderboardGet({
        redis: context.redis,
        sort: 'DESC',
      }),
      globalStatsGet({
        redis: context.redis,
      }),
      context.userId
        ? userGetOrSet({
            ctx: context,
          })
        : null,
    ])

    if (!profile) {
      return {
        status: 'viewLeaderboard',
        standings,
        profile: null,
        globalStats,
      }
    }

    if (profile.blocked) {
      return {
        status: 'notAllowed',
      }
    }

    if (!profile.hasVerifiedEmail) {
      return {
        status: 'needsToVerifyEmail',
      }
    }

    if (
      // Always show leaderboard if they're on the leaderboard subreddit
      config2.leaderboard.subredditId === context.subredditId
    ) {
      return {
        status: 'viewLeaderboard',
        standings,
        profile,
        globalStats,
      }
    }

    if (didUserBeatTheGame(profile)) {
      return {
        status: 'beatTheGame',
      }
    }

    const result = await levelsIsUserInRightPlace({
      ctx: context,
      profile: profile,
    })

    if (
      // We only show claim global point when they're on the last subreddit now
      config2.levels.at(-1)!.subredditId === context.subredditId
    ) {
      // Only show this screen if they're on the right leaderboard
      // and they pass the check
      if (result.pass) {
        return {
          status: 'claimGlobalPoint',
          standings,
          profile,
          team: getTeamFromUserId(profile.t2),
        }
      }

      const {pass: _pass, ...rest} = result
      return {status: 'dialog', ...rest, profile}
    }

    return {
      status: 'viewLeaderboard',
      standings,
      profile,
      globalStats,
    }
  })

  if (state.status === 'needsToVerifyEmail') {
    return (
      <DialogVerifyEmail
        level={
          config2.levels.find(lvl => lvl.subredditId === context.subredditId)
            ?.id ?? 0
        }
        pixelRatio={pixelRatio}
        onPress={async () => {
          context.ui.navigateTo('https://www.reddit.com/settings/account')
        }}
      />
    )
  }

  if (state.status === 'beatTheGame') {
    return (
      <DialogBeatGame
        level={
          config2.levels.find(lvl => lvl.subredditId === context.subredditId)
            ?.id ?? 0
        }
        pixelRatio={pixelRatio}
      />
    )
  }

  if (state.status === 'dialog') {
    return (
      <DialogUnauthorized
        level={
          config2.levels.find(lvl => lvl.subredditId === context.subredditId)
            ?.id ?? 0
        }
        currentLevel={state.profile.currentLevel}
        redirectURL={state.redirectURL}
        pixelRatio={pixelRatio}
      />
    )
  }

  if (state.status === 'notAllowed') {
    return (
      <DialogNotAllowed
        level={
          config2.levels.find(lvl => lvl.subredditId === context.subredditId)
            ?.id ?? 0
        }
        pixelRatio={pixelRatio}
      />
    )
  }

  const updateState = async () => {
    const newValue = await leaderboardGet({
      redis: context.redis,
      sort: 'DESC',
    })
    setState(x => ({
      ...x,
      standings: newValue,
    }))
  }

  useInterval(updateState, 30_000).start()

  if (state.status === 'claimGlobalPoint') {
    return (
      <PointClaimScreen
        standings={state.standings}
        pixelRatio={pixelRatio}
        team={state.team}
        onClaimPress={async () => {
          await userAttemptToClaimGlobalPointForTeam({
            ctx: context,
            userId: state.profile.t2,
          })
        }}
      />
    )
  }

  return (
    <LeaderboardView
      standings={state.standings.sort((a, b) => a.member - b.member)}
      pixelRatio={props.pixelRatio}
      showPlayButton={
        forcePlayField || !state.profile || !didUserBeatTheGame(state.profile)
      }
      onPlay={() => context.ui.navigateTo(config2.levels[0]!.url)}
      onSubscribe={async () => {
        await context.reddit.subscribeToCurrentSubreddit()
        context.ui.showToast('Subscribed to r/GamesOnReddit')
        if (context.userId) {
          await userSetNewGamePlusIfNotExists({
            redis: context.redis,
            userId: context.userId as T2,
          })
          setForcePlayField(true)
        }
      }}
      players={state.globalStats.totalPlayers}
      bans={state.globalStats.totalBans}
      fields={state.globalStats.totalFields}
    />
  )
}
