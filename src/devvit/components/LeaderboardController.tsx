import {type Context, Devvit, useInterval} from '@devvit/public-api'
import type {Profile} from '../../shared/save.js'
import {type Team, getTeamFromUserId} from '../../shared/team.js'
import {fallbackPixelRatio} from '../../shared/theme.js'
import {config2} from '../../shared/types/level.js'
import type {T2} from '../../shared/types/tid.js'
import {useState2} from '../hooks/use-state2.js'
import {leaderboardGet} from '../server/core/leaderboards/global/leaderboard.js'
import {levelsIsUserInRightPlace} from '../server/core/levels.js'
import {
  userAttemptToClaimGlobalPointForTeam,
  userGet,
} from '../server/core/user.js'
import {DialogNotAllowed} from './DialogNotAllowed.js'
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
    }

export function LeaderboardController(
  props: LeaderboardControllerProps,
  context: Context,
): JSX.Element {
  const pixelRatio =
    context.uiEnvironment?.dimensions?.scale ?? fallbackPixelRatio

  const [state, setState] = useState2<LeaderboardControllerState>(async () => {
    const [standings, profile] = await Promise.all([
      leaderboardGet({
        redis: context.redis,
        sort: 'DESC',
      }),
      context.userId
        ? userGet({
            redis: context.redis,
            userId: context.userId as T2,
          })
        : null,
    ])

    if (!profile) {
      return {
        status: 'viewLeaderboard',
        standings,
        profile: null,
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

    if (profile.globalPointCount > 0) {
      return {
        status: 'viewLeaderboard',
        standings,
        profile,
      }
    }

    const result = await levelsIsUserInRightPlace({
      ctx: context,
      profile: profile,
    })

    if (result.pass) {
      return {
        status: 'claimGlobalPoint',
        standings,
        profile,
        team: getTeamFromUserId(profile.t2),
      }
    }

    return {
      status: 'viewLeaderboard',
      standings,
      profile,
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
          console.log('to-do: not yet implemented!')
        }}
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

  // to-do: add the number of players, bans, and fields
  return (
    <LeaderboardView
      standings={state.standings.sort((a, b) => a.member - b.member)}
      pixelRatio={props.pixelRatio}
      onPlay={() => context.ui.navigateTo(config2.levels[0]!.url)}
      players={0}
      bans={0}
      fields={0}
    />
  )
}
