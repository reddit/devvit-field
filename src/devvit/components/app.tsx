// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, type UseChannelResult, useAsync} from '@devvit/public-api'
import {useChannel, useWebView} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime'
import {GLOBAL_REALTIME_CHANNEL} from '../../shared/const.ts'
import {
  generatePartitionKeys,
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
  RealtimeMessage,
  TeamBoxCounts,
} from '../../shared/types/message.ts'
import {diffArrays} from '../../shared/util.ts'
import {useSession} from '../hooks/use-session.ts'
import {useState2} from '../hooks/use-state2.ts'
import {type AppState, appInitState} from '../server/core/app.js'
import {fieldClaimCells, fieldGetDeltas} from '../server/core/field.js'
import {levels, levelsIsUserInRightPlace} from '../server/core/levels.js'
import {
  userAttemptToClaimSpecialPointForTeam,
  userGet,
} from '../server/core/user.js'
import {Title} from './title.tsx'

export function App(ctx: Devvit.Context): JSX.Element {
  const session = useSession(ctx)
  const [appState, setAppState] = useState2(async () => await appInitState(ctx))
  const [activeConnections, setActiveConnections] = useState2<PartitionKey[]>(
    [],
  )

  useAsync<Delta[]>(
    async () => {
      if (appState.pass === false || activeConnections.length === 0) return []

      const deltas = await Promise.all(
        activeConnections.map(key =>
          fieldGetDeltas({
            challengeNumber: appState.challengeNumber,
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
    if (!state.pass) return

    const {
      profile,
      challengeConfig,
      challengeNumber,
      initialDeltas,
      initialGlobalXY,
      initialCellsClaimed,
      visible,
    } = state

    const p1 = {profile, sid: session.sid}

    iframe.postMessage({
      challenge: challengeNumber,
      connected: chan.status === ChannelStatus.Connected,
      debug: session.debug,
      field: {
        partSize: challengeConfig.partitionSize,
        wh: {w: challengeConfig.size, h: challengeConfig.size},
      },
      lvl: state.level.id,
      p1,
      p1BoxCount: 0, //to-do: fill me out.
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

  const partitionKeys: PartitionKey[] =
    appState.pass === true
      ? generatePartitionKeys(
          appState.challengeConfig.size,
          appState.challengeConfig.partitionSize,
        )
      : []

  const channelMap: Record<
    PartitionKey,
    UseChannelResult<{deltas: Delta[]}>
  > = {}

  /**
   * Partition keys should ALWAYS BE STATIC AND THE SAME no matter how many
   * times the functions are called. We're putting hooks in a for loop because
   * I don't know how to conditionally register them in our current model. We
   * store all of them in memory in a look up map and ONLY subscribe once the
   * iframe tells us explicitly.
   *
   * I don't see anything too expensive to doing this inside the hook since we
   * aren't subscribing. I'd love to hear of a better way. Since we're relying on
   * postmessage I think a nonhooks version of this would be nice.
   */
  for (const key of partitionKeys) {
    channelMap[key] = useChannel({
      name: key,
      onMessage(msg) {
        iframe.postMessage({
          type: 'Box',
          deltas: msg.deltas,
        })
      },
      // TODO: Does the iframe really want to know about all of these subscribe events?
    })
  }

  async function onMsg(msg: IframeMessage): Promise<void> {
    if (session.debug)
      console.log(
        `${appState.pass ? appState.profile.username : 'app state no pass'} Devvit ← iframe msg=${JSON.stringify(msg)}`,
      )

    switch (msg.type) {
      case 'ConnectPartitions': {
        if (appState.pass === false) return

        const newConnections = msg.parts.map(part =>
          makePartitionKey(
            getPartitionCoords(part, appState.challengeConfig.partitionSize),
          ),
        )

        const {toUnsubscribe, toSubscribe} = diffArrays(
          activeConnections,
          newConnections,
        )

        for (const key of toSubscribe) {
          const channel = channelMap[key]
          if (!channel) {
            console.error(`channel subscribe: channel ${key} not found`)
            continue
          }
          channel.subscribe()
        }
        for (const key of toUnsubscribe) {
          const channel = channelMap[key]
          if (!channel) {
            console.error(`channel unsubscribe: channel ${key} not found`)
            continue
          }
          channel.unsubscribe()
        }

        // Note, I don't circuit break here because I think it may slow the experience
        // for the user. Instead, I set state and use `useAsync` to get the current
        // state of the partitions since realtime is only the deltas
        setActiveConnections(newConnections.sort())

        break
      }
      case 'Loaded':
        break
      case 'Registered': {
        if (appState.pass === false) {
          const {pass: _pass, ...rest} = appState
          iframe.postMessage({type: 'Dialog', ...rest})
          break
        }
        sendInitToIframe(appState)

        break
      }
      case 'ClaimBoxes': {
        if (appState.pass === false) {
          const {pass: _pass, ...rest} = appState
          iframe.postMessage({type: 'Dialog', ...rest})
          return
        }

        const profile = await userGet({
          redis: ctx.redis,
          userId: appState.profile.t2,
        })

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

        const {deltas} = await fieldClaimCells({
          challengeNumber: appState.challengeNumber,
          coords: msg.boxes,
          ctx,
          userId: appState.profile.t2,
        })

        iframe.postMessage({
          type: 'Box',
          deltas,
        })

        break
      }
      case 'OnNextChallengeClicked': {
        if (appState.pass === false) break

        // This handles ascension! Keep in mind that if
        // we get here all of the state in the app is now
        // old so we need to refresh all of it
        const newAppState = await appInitState(ctx)

        setAppState(newAppState)

        // TODO: Do I also need to set loaded back to false here?

        if (newAppState.pass) {
          console.log('user did not ascend, reiniting iframe')

          // User did not ascend, close dialog and continue
          sendInitToIframe(appState, {reinit: true})
        } else {
          console.log('user ascended, redirecting', newAppState)
          ctx.ui.navigateTo(newAppState.redirectURL)
        }

        break
      }
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
          `${appState.pass ? appState.profile.username : 'app state no pass'} Devvit ← realtime msg=${JSON.stringify(msg)}`,
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
