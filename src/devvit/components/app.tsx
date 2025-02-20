// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, type JSONValue} from '@devvit/public-api'
import {useChannel, useWebView} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime'
import {GLOBAL_REALTIME_CHANNEL} from '../../shared/const.ts'
import {getPartitionCoords} from '../../shared/partition.ts'
import {playButtonWidth} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {
  DevvitMessage,
  IframeMessage,
  RealtimeMessage,
} from '../../shared/types/message.ts'
import {Random} from '../../shared/types/random.ts'
import {useSession} from '../hooks/use-session.ts'
import {useState2} from '../hooks/use-state2.ts'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  makeSafeChallengeConfig,
} from '../server/core/challenge.js'
import {fieldClaimCells, fieldGetDeltas} from '../server/core/field.js'
import {userGetOrSet} from '../server/core/user.js'
import {Title} from './title.tsx'

export function App(ctx: Devvit.Context): JSX.Element {
  const session = useSession(ctx)
  const [
    {challengeConfig, challengeNumber, profile, initialDeltas, initialGlobalXY},
  ] = useState2(async () => {
    const [profile, challengeNumber] = await Promise.all([
      userGetOrSet({ctx}),
      challengeGetCurrentChallengeNumber({redis: ctx.redis}),
    ])

    const challengeConfig = await challengeConfigGet({
      redis: ctx.redis,
      challengeNumber,
    })

    const rnd = new Random(challengeConfig.seed)
    const initialGlobalXY: XY = {
      x: Math.trunc(rnd.num * challengeConfig.size),
      y: Math.trunc(rnd.num * challengeConfig.size),
    }

    const deltas = await fieldGetDeltas({
      challengeNumber,
      redis: ctx.redis,
      partitionXY: getPartitionCoords(
        initialGlobalXY,
        challengeConfig.partitionSize,
      ),
    })

    return {
      challengeNumber,
      profile,
      // DO NOT RETURN THE SEED
      challengeConfig: makeSafeChallengeConfig(challengeConfig),
      initialGlobalXY,
      initialDeltas: deltas,
    }
  })

  const p1 = {profile, sid: session.sid}

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

  async function onMsg(msg: IframeMessage): Promise<void> {
    if (session.debug)
      console.log(
        `${profile.username} Devvit ← iframe msg=${JSON.stringify(msg)}`,
      )

    switch (msg.type) {
      case 'Loaded':
        setLoaded((loaded = true))
        break
      case 'Registered':
        iframe.postMessage({
          challenge: challengeNumber,
          connected: chan.status === ChannelStatus.Connected,
          debug: session.debug,
          field: {wh: {w: challengeConfig.size, h: challengeConfig.size}},
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
        })
        break
      case 'ClaimBoxes': {
        const {deltas} = await fieldClaimCells({
          challengeNumber,
          coords: msg.boxes,
          ctx,
          userId: profile.t2,
        })

        iframe.postMessage({
          type: 'Box',
          deltas,
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
