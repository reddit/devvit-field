// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, useAsync} from '@devvit/public-api'
import {useChannel, useWebView} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime'
import {GLOBAL_REALTIME_CHANNEL} from '../../shared/const.ts'
import {
  getPartitionCoords,
  makePartitionKey,
  parsePartitionXY,
} from '../../shared/partition.ts'
import {getTeamFromUserId} from '../../shared/team.ts'
import {playButtonWidth} from '../../shared/theme.ts'
import type {PartitionKey} from '../../shared/types/2d.ts'
import type {Delta} from '../../shared/types/field.ts'
import type {
  DevvitMessage,
  IframeMessage,
  PartitionUpdate,
  RealtimeMessage,
  TeamBoxCounts,
} from '../../shared/types/message.ts'
import {useSession} from '../hooks/use-session.ts'
import {useState2} from '../hooks/use-state2.ts'
import {type AppState, appInitState} from '../server/core/app.js'
import {fieldClaimCells, fieldGetDeltas} from '../server/core/field.js'
import {
  LEADERBOARD_CONFIG,
  levels,
  levelsIsUserInRightPlace,
} from '../server/core/levels.js'
import {
  userAttemptToClaimSpecialPointForTeam,
  userGet,
} from '../server/core/user.js'
import {LeaderboardController} from './LeaderboardController.tsx'
import {Title} from './title.tsx'
//import { CountdownController } from './CountdownController.tsx';

export function App(ctx: Devvit.Context): JSX.Element {
  if (
    ctx.subredditId === LEADERBOARD_CONFIG.subredditId &&
    ctx.postId === LEADERBOARD_CONFIG.postId
  ) {
    // TODO: add conditional to render countdown... not sure about timing yet.
    //return <CountdownController />;
    return <LeaderboardController />
  }
  const session = useSession(ctx)
  const [appState, setAppState] = useState2(async () => await appInitState(ctx))
  const [activeConnections, setActiveConnections] = useState2<PartitionKey[]>(
    [],
  )

  if (appState.status === 'needsToVerifyEmail') {
    return (
      <vstack alignment='center middle'>
        <text>You need to verify your email before playing</text>
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button
          onPress={async () => {
            console.log('not yet implemented!')
          }}
        >
          Check status
        </button>
      </vstack>
    )
  }

  if (appState.status === 'notAllowed') {
    return (
      <vstack alignment='center middle'>
        <text>Sorry, you can't access this post</text>
      </vstack>
    )
  }

  // TODO: Remove this once the webview can get this from S3
  useAsync<Delta[]>(
    async () => {
      if (appState.status !== 'pass' || activeConnections.length === 0)
        return []

      const deltas = await Promise.all(
        activeConnections.map(key =>
          fieldGetDeltas({
            challengeNumber: appState.challengeNumber,
            subredditId: ctx.subredditId,
            redis: ctx.redis,
            partitionXY: parsePartitionXY(key),
          }),
        ),
      )

      return deltas.flat()
    },
    {
      // Depends is a JSON.stringify check so order matters!
      depends: activeConnections.sort(),
      finally(data, error) {
        if (error) {
          console.error('useAsync get deltas error:', error)
        }
        if (!data) return

        iframe.postMessage({
          type: 'Box',
          deltas: data,
        })
      },
    },
  )

  const iframe = useWebView<IframeMessage, DevvitMessage>({onMessage: onMsg})

  function sendInitToIframe(
    state: AppState,
    {reinit}: {reinit: boolean} = {reinit: false},
  ): void {
    if (state.status !== 'pass') return

    const {
      appConfig,
      profile,
      challengeConfig,
      challengeNumber,
      initialDeltas,
      initialGlobalXY,
      initialCellsClaimed,
      visible,
      minesHitByTeam,
    } = state

    const p1 = {profile, sid: session.sid}

    iframe.postMessage({
      appConfig,
      bannedPlayers: minesHitByTeam.reduce((acc, v) => acc + v.score, 0),
      challenge: challengeNumber,
      connected: chan.status === ChannelStatus.Connected,
      debug: session.debug,
      field: {
        bans: challengeConfig.totalNumberOfMines,
        partSize: challengeConfig.partitionSize,
        wh: {w: challengeConfig.size, h: challengeConfig.size},
      },
      lvl: state.level.id,
      p1,
      p1BoxCount: profile.lastPlayedChallengeNumberCellsClaimed,
      players: 0, // to-do: fill me out. useChannel2()?
      sub: ctx.subredditName ?? '',
      team: getTeamFromUserId(profile.t2),
      teamBoxCounts: initialCellsClaimed
        .sort((a, b) => a.member - b.member)
        .map(x => x.score) as TeamBoxCounts,
      type: 'Init',
      visible,
      initialDeltas,
      initialGlobalXY,
      reinit,
    })
  }

  const partitionUpdateChannel = useChannel<Omit<PartitionUpdate, 'type'>>({
    name: 'partition_update',
    onMessage(msg) {
      iframe.postMessage({
        type: 'PartitionUpdate',
        ...msg,
      })
    },
  })
  partitionUpdateChannel.subscribe()

  async function onMsg(msg: IframeMessage): Promise<void> {
    if (session.debug)
      console.log(
        `${
          appState.status === 'pass'
            ? appState.profile.username
            : 'app state no pass'
        } Devvit ← iframe msg=${JSON.stringify(msg)}`,
      )

    switch (msg.type) {
      case 'ConnectPartitions': {
        if (appState.status !== 'pass') return

        const newConnections = msg.parts.map(part =>
          makePartitionKey(
            getPartitionCoords(part, appState.challengeConfig.partitionSize),
          ),
        )

        // Note, I don't circuit break here because I think it may slow the experience
        // for the user. Instead, I set state and use `useAsync` to get the current
        // state of the partitions since realtime is only the deltas
        setActiveConnections(newConnections.sort())

        break
      }
      case 'Loaded':
        break
      case 'Registered': {
        if (appState.status === 'dialog') {
          const {status: _status, ...rest} = appState
          iframe.postMessage({type: 'Dialog', ...rest})
        } else if (appState.status === 'pass') {
          sendInitToIframe(appState)
        }

        break
      }
      case 'ClaimBoxes': {
        if (appState.status === 'dialog') {
          const {status: _status, ...rest} = appState
          iframe.postMessage({type: 'Dialog', ...rest})
        } else if (appState.status === 'pass') {
          // Get a fresh profile in case something has changed!
          const profile = await userGet({
            redis: ctx.redis,
            userId: appState.profile.t2,
          })

          if (profile.blocked) {
            console.warn('Cannot claim boxes, user is not allowed to play.')
            return
          }

          if (!profile.hasVerifiedEmail) {
            console.warn('Cannot claim boxes, user needs to verify email.')
            return
          }

          const result = await levelsIsUserInRightPlace({
            ctx,
            // You need to call this instead of the appState since
            // app state can be stale. Use case where you hit this:
            // 1. User claims a mine
            // 2. User tries to click again before we show
            //    the game over dialog
            profile,
          })

          if (result.pass === false) {
            const {pass: _pass, ...rest} = result
            iframe.postMessage({type: 'Dialog', ...rest})
            return
          }

          const lastLevel = levels[levels.length - 1]!

          // Attempt to claim a global point if on the last level
          if (lastLevel.id === profile.currentLevel) {
            const {success} = await userAttemptToClaimSpecialPointForTeam({
              ctx,
              userId: profile.t2,
            })

            if (success) {
              ctx.ui.showToast('Global point claimed! Redirecting to level 0.')
              ctx.ui.navigateTo(levels[0]!.url)
            } else {
              ctx.ui.showToast('Global claim fail, try again.')
            }

            return
          }

          const {deltas, newLevel} = await fieldClaimCells({
            challengeNumber: appState.challengeNumber,
            coords: msg.boxes,
            ctx,
            userId: appState.profile.t2,
          })

          // Before returning the result to the client, we need to check if the user hit a mine
          // and if they did we don't let them try to click again.
          //
          // I do a naive current level check to save us another read on the click path.
          // Note: newLevel can return 0 and we still want to do the check
          if (newLevel !== undefined) {
            const result = await levelsIsUserInRightPlace({
              ctx,
              profile: {
                ...profile,
                // Users only descend levels when they hit a mine so we can
                // assume what the state would be if we looked i up live.
                lastPlayedChallengeNumberForLevel: 0,
                lastPlayedChallengeNumberCellsClaimed: 0,
                currentLevel: newLevel,
              },
            })

            if (result.pass === false) {
              const {pass: _pass, ...rest} = result
              iframe.postMessage({type: 'Dialog', ...rest})
              return
            }

            // They passed, so even though we got a new level, we let it ride
            // since the next tap will validate before submit
          }

          iframe.postMessage({
            type: 'Box',
            deltas,
          })
        }

        break
      }
      case 'OnNextChallengeClicked': {
        if (appState.status !== 'pass') break

        // This handles ascension! Keep in mind that if
        // we get here all of the state in the app is now
        // old so we need to refresh all of it
        const newAppState = await appInitState(ctx)

        setAppState(newAppState)

        // TODO: Do I also need to set loaded back to false here?

        if (newAppState.status === 'pass') {
          console.log('user did not ascend, reiniting iframe')

          // User did not ascend, close dialog and continue
          sendInitToIframe(newAppState, {reinit: true})
        } else if (newAppState.status === 'dialog') {
          console.log('user ascended, redirecting', newAppState)
          ctx.ui.navigateTo(newAppState.redirectURL)
        }

        break
      }
      case 'OpenLeaderboard':
        // to-do: PascalCase URL once it doesn't redirect.
        ctx.ui.navigateTo('https://www.reddit.com/r/gamesonreddit')
        break
      case 'Dialog':
        ctx.ui.navigateTo(msg.redirectURL)
        break

      default:
        msg satisfies never
    }
  }

  const chan = useChannel<RealtimeMessage>({
    name: GLOBAL_REALTIME_CHANNEL,
    onMessage(msg) {
      if (session.debug)
        console.log(
          `${
            appState.status === 'pass'
              ? appState.profile.username
              : 'app state no pass'
          } Devvit ← realtime msg=${JSON.stringify(msg)}`,
        )

      iframe.postMessage(msg)
    },
    onSubscribed: () => iframe.postMessage({type: 'Connected'}),
    onUnsubscribed: () => iframe.postMessage({type: 'Disconnected'}),
  })
  chan.subscribe() // to-do: verify platform unsubscribes hidden posts.

  return (
    <Title>
      {/* biome-ignore lint/a11y/useButtonType: */}
      <button
        appearance='secondary'
        size='large'
        minWidth={`${playButtonWidth}px`}
        icon='play-outline'
        onPress={() => iframe.mount()}
      >
        Enter the BanField
      </button>
    </Title>
  )
}
