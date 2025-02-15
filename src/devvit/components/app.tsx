// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {type JSONValue, useChannel, useWebView} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime'
import {GLOBAL_REALTIME_CHANNEL} from '../../shared/const.ts'
import type {
  DevvitMessage,
  IframeMessage,
  RealtimeMessage,
} from '../../shared/types/message.ts'
import {useSession} from '../hooks/use-session.ts'
import {useState2} from '../hooks/use-state2.ts'
import {
  challengeConfigGetClientSafeProps,
  challengeGetCurrentChallengeNumber,
} from '../server/core/challenge.ts'
import {fieldClaimCells} from '../server/core/field.ts'
import {userGetOrSet} from '../server/core/user.ts'
import {Title} from './title.tsx'

export function App(ctx: Devvit.Context): JSX.Element {
  const session = useSession(ctx)
  const [{challengeConfig, challengeNumber, profile}] = useState2(async () => {
    const [profile, challengeNumber] = await Promise.all([
      userGetOrSet({ctx}),
      challengeGetCurrentChallengeNumber({redis: ctx.redis}),
    ])

    const challengeConfig = await challengeConfigGetClientSafeProps({
      redis: ctx.redis,
      challengeNumber,
    })

    return {
      challengeNumber,
      profile,
      challengeConfig,
    }
  })

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
    iframe.postMessage = (msg: DevvitMessage) =>
      ctx.ui.webView.postMessage('web-view', msg)

  async function onMsg(msg: IframeMessage): Promise<void> {
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
          field: {wh: {w: challengeConfig.size, h: challengeConfig.size}},
          mode: mounted ? 'PopOut' : 'PopIn',
          p1,
          type: 'Init',
        })
        break
      case 'ClaimCells': {
        const {deltas} = await fieldClaimCells({
          challengeNumber,
          coords: msg.cells,
          ctx,
          userId: profile.t2,
        })

        iframe.postMessage({
          type: 'Cell',
          boxes: deltas.map(({coord: xy, team, isMine}) => ({
            cell: isMine ? 'Ban' : 'Clear',
            xy,
            team,
          })),
        })

        break
      }

      default:
        msg satisfies never
    }
  }

  const [messages, setMessages] = useState2<string[]>([])

  useChannel<{now: string}>({
    name: `challenge_${challengeNumber}`,
    // TODO: There's no guarantee that the latest message will always
    // be the most current representation of the challenge. We should
    // only set the state if this message (by timestamp) is newer than
    // the current state.
    onMessage: msg => {
      setMessages([...messages, msg.now].reverse().slice(0, 10).reverse())
    },
  }).subscribe()

  const chan = useChannel<RealtimeMessage>({
    name: GLOBAL_REALTIME_CHANNEL,
    onMessage(msg) {
      if (session.debug)
        console.log(
          `${profile.username} Devvit ← realtime msg=${JSON.stringify(msg)}`,
        )

      if (msg.type === 'ChallengeComplete') {
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
    // Hack: DX-8859 ID must be specified here and in postMessage().
    <Title loaded={mounted && loaded}>
      {!mounted && (
        <webview
          grow
          height='100%'
          id='web-view'
          onMessage={onMsg as (message: JSONValue) => Promise<void>}
          url='index.html'
          width='100%'
        />
      )}
    </Title>
  )
}
