// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, type JSONValue} from '@devvit/public-api'
import {useChannel, useWebView} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime'
import {GLOBAL_REALTIME_CHANNEL} from '../../shared/const.ts'
import {playButtonWidth} from '../../shared/theme.ts'
import type {
  DevvitMessage,
  IframeMessage,
  RealtimeMessage,
} from '../../shared/types/message.ts'
import {useSession} from '../hooks/use-session.ts'
import {useState2} from '../hooks/use-state2.ts'
import {type AppState, appInitState} from '../server/core/app.js'
import {
  fieldClaimCells,
  fieldValidateUserAndAttemptAscend,
} from '../server/core/field.js'
import {userAttemptToClaimSpecialPointForTeam} from '../server/core/user.js'
import {Title} from './title.tsx'

export function App(ctx: Devvit.Context): JSX.Element {
  const session = useSession(ctx)
  const [appState, setAppState] = useState2(async () => await appInitState(ctx))

  let [loaded, setLoaded] = useState2(false)
  // to-do: move to UseWebViewResult.mounted.
  let [mounted, setMounted] = useState2(false)
  const iframe = useWebView<IframeMessage, DevvitMessage>({
    onMessage: onMsg,
    onUnmount() {
      setLoaded((loaded = false))
      setMounted((mounted = false))
    },
  })
  // to-do: support three mount states from hook.
  // to-do: delete Android condition.
  if (!mounted && session.userAgent.client !== 'Android')
    iframe.postMessage = (msg: DevvitMessage) => ctx.ui.webView.postMessage(msg)

  function popOut(): void {
    setLoaded((loaded = false))
    setMounted((mounted = true))
    mounted = true
    iframe.mount()
  }

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
      mode: mounted ? 'PopOut' : 'PopIn',
      p1,
      players: 0, // to-do: fill me out. useChannel2()?
      sub: ctx.subredditName ?? '',
      team: 1, // to-do: fill me out.
      teamBoxCounts: [0, 0, 0, 0], // to-do: fill me out.
      type: 'Init',
      visible: 0, // to-do: fill me out.
      initialDeltas,
      initialGlobalXY,
      reinit,
    })
  }

  async function onMsg(msg: IframeMessage): Promise<void> {
    if (session.debug)
      console.log(
        `${appState.pass ? appState.profile.username : 'app state no pass'} Devvit ← iframe msg=${JSON.stringify(msg)}`,
      )

    switch (msg.type) {
      case 'ConnectPartitions':
        console.log(
          `to-do: sub/unsub partition realtime ${JSON.stringify(msg.parts)}`,
        )
        break
      case 'Loaded':
        setLoaded((loaded = true))
        break
      case 'Registered': {
        if (appState.pass === false) {
          const {pass: _pass, ...rest} = appState
          iframe.postMessage({type: 'Dialog', ...rest})
          return
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
        const result = await fieldValidateUserAndAttemptAscend({
          challengeNumber: appState.challengeNumber,
          ctx,
          profile: appState.profile,
        })

        if (result.pass === false) {
          const {pass: _pass, ...rest} = result
          iframe.postMessage({type: 'Dialog', ...rest})
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
          // User did not ascend, close dialog and continue
          sendInitToIframe(appState, {reinit: true})
        } else {
          ctx.ui.navigateTo(newAppState.redirectURL)
        }

        break
      }
      case 'ClaimGlobalPointForTeam': {
        if (appState.pass === false) {
          const {pass: _pass, ...rest} = appState
          iframe.postMessage({type: 'Dialog', ...rest})
          return
        }

        await userAttemptToClaimSpecialPointForTeam({
          ctx,
          userId: appState.profile.t2,
        })

        break
      }

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

      if (msg.type === 'ChallengeComplete') {
        // TODO: Unsubscribe listeners? Or, let them continue to flow knowing that we'll get the
        // deltas when we reinit the app?
        ctx.ui.showToast('Challenge Complete. Devs please do something!')
      }

      iframe.postMessage(msg)
    },
    onSubscribed: () => iframe.postMessage({type: 'Connected'}),
    onUnsubscribed: () => iframe.postMessage({type: 'Disconnected'}),
  })
  chan.subscribe() // to-do: verify platform unsubscribes hidden posts.

  return (
    // Hack: turning off the loading animation changes the DOM which causes the
    //       web view to be loaded, discarded, and loaded again. No webview in
    //       the tree during pop-out mode but just let it forever spin when put
    //       in.
    <Title loaded={mounted && loaded}>
      {/* to-do: delete Android specialization. */}
      {!mounted && session.userAgent.client !== 'Android' && (
        <webview
          grow
          height='100%'
          onMessage={onMsg as (message: JSONValue) => Promise<void>}
          url='index.html'
          width='100%'
        />
      )}
      {/* biome-ignore lint/a11y/useButtonType: */}
      <button
        appearance='secondary'
        size='large'
        minWidth={`${playButtonWidth}px`}
        icon='play-outline'
        onPress={popOut}
      >
        Enter the BanField
      </button>
    </Title>
  )
}
