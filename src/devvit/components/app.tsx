// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {type JSONValue, useChannel, useWebView} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime'
import {
  type DevvitMessage,
  type IframeMessage,
  type RealtimeMessage,
  realtimeVersion,
} from '../../shared/types/message.ts'
import {useChannel2} from '../hooks/use-channel2.js'
import {useSession} from '../hooks/use-session.ts'
import {useState2} from '../hooks/use-state2.ts'
import {challengeGetCurrentChallengeNumber} from '../server/core/challenge.tsx'
import {userGetOrSet} from '../server/core/user.ts'
import {Title} from './title.tsx'

export function App(ctx: Devvit.Context): JSX.Element {
  const session = useSession(ctx)
  const [currentChallengeNumber] = useState2(() =>
    challengeGetCurrentChallengeNumber({redis: ctx.redis}),
  )
  const [profile] = useState2(async () => userGetOrSet({ctx}))
  const p1 = {profile, sid: session.sid}

  const [loaded, setLoaded] = useState2(false)
  // to-do: move to UseWebViewResult.mounted.
  const [mounted, setMounted] = useState2(false)
  const iframe = useWebView<IframeMessage, DevvitMessage>({
    onMessage: onMsg,
    onUnmount() {
      setLoaded(false)
      setMounted(false)
    },
  })
  // to-do: support three mount states from hook.
  if (!mounted)
    iframe.postMessage = (msg: DevvitMessage) => ctx.ui.webView.postMessage(msg)

  function onMsg(msg: IframeMessage): void {
    if (session.debug)
      console.log(
        `${profile.username} Devvit ← iframe msg=${JSON.stringify(msg)}`,
      )

    switch (msg.type) {
      case 'Loaded':
        setLoaded(true)
        break
      case 'PopOut':
        setLoaded(false)
        setMounted(true)
        iframe.mount()
        break
      case 'Registered':
        iframe.postMessage({
          connected: chan.status === ChannelStatus.Connected,
          debug: session.debug,
          // to-do: make this configurable.
          field: {wh: {w: 3333, h: 3333}},
          mode: mounted ? 'PopOut' : 'PopIn',
          p1,
          type: 'Init',
        })
        break
      default:
        msg satisfies never
    }
  }

  const [messages, setMessages] = useState2<string[]>([])

  useChannel<{now: string}>({
    name: `challenge_${currentChallengeNumber}`,
    // TODO: There's no guarantee that the latest message will always
    // be the most current representation of the challenge. We should
    // only set the state if this message (by timestamp) is newer than
    // the current state.
    onMessage: msg => {
      setMessages([...messages, msg.now].reverse().slice(0, 10).reverse())
    },
  }).subscribe()

  const chan = useChannel2<RealtimeMessage>({
    chan: session.t3,
    onPeerMessage(msg) {
      if (session.debug)
        console.log(
          `${profile.username} Devvit ← realtime msg=${JSON.stringify(msg)}`,
        )
      iframe.postMessage(msg)
    },
    p1,
    version: realtimeVersion,
    onConnected: () => iframe.postMessage({type: 'Connected'}),
    onDisconnected: () => iframe.postMessage({type: 'Disconnected'}),
    // to-do: onOutdated alert.
  })
  chan.subscribe() // to-do: verify platform unsubscribes hidden posts.

  return (
    // Hack: turning off the loading animation changes the DOM which causes the
    //       web view to be loaded, discarded, and loaded again. No webview in
    //       the tree during pop-out mode but just let it forever spin when put
    //       in.
    <Title loaded={mounted && loaded}>
      {!mounted && (
        <webview
          grow
          height='100%'
          onMessage={onMsg as (message: JSONValue) => Promise<void>}
          url='index.html'
          width='100%'
        />
      )}
    </Title>
  )
}
