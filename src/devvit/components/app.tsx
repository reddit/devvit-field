// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, useAsync, useInterval} from '@devvit/public-api'
import {useChannel, useWebView} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime'
import {INSTALL_REALTIME_CHANNEL} from '../../shared/const.ts'
import {getTeamFromUserId} from '../../shared/team.ts'
import {fallbackPixelRatio} from '../../shared/theme.ts'
import {type FieldFixtureData, config2} from '../../shared/types/level.ts'
import type {
  ChallengeCompleteMessage,
  DevvitMessage,
  IframeMessage,
  InitDevvitMessage,
  RealtimeMessage,
  TeamBoxCounts,
} from '../../shared/types/message.ts'
import {useSession} from '../hooks/use-session.ts'
import {useState2} from '../hooks/use-state2.ts'
import {activePlayersIncrement} from '../server/core/activePlayers.js'
import {type AppState, appInitState} from '../server/core/app.js'
import {fieldClaimCells} from '../server/core/field.js'
import {levelsIsUserInRightPlace} from '../server/core/levels.js'
import {
  userAttemptToClaimGlobalPointForTeam,
  userGet,
} from '../server/core/user.js'
import {DialogHowToPlay} from './DialogHowToPlay.tsx'
import {DialogNotAllowed} from './DialogNotAllowed.tsx'
import {DialogUnauthorized} from './DialogUnauthorized.tsx'
import {DialogVerifyEmail} from './DialogVerifyEmail.tsx'
import {DialogWelcome} from './DialogWelcome.tsx'
import {LeaderboardController} from './LeaderboardController.tsx'

/** @ret true if code is executing locally on device, false if remotely on server. */
function isLocal(): boolean {
  return !`${fetch}`.includes('getHttpPlugin')
}

export const LEADERBOARD_CONFIG: Readonly<FieldFixtureData['leaderboard']> =
  config2.leaderboard

export const levels: Readonly<FieldFixtureData['levels']> = config2.levels

export function App(ctx: Devvit.Context): JSX.Element {
  const pixelRatio = ctx.uiEnvironment?.dimensions?.scale ?? fallbackPixelRatio

  if (
    ctx.subredditId === config2.leaderboard.subredditId &&
    ctx.postId === config2.leaderboard.postId
  ) {
    // to-do: avoid postId in above checks. Not great having to submit a post, then hardcode the postId in the app code and upload a new version.
    return <LeaderboardController pixelRatio={pixelRatio} />
  }
  const session = useSession(ctx)
  const [challengeEndedState, setChallengeEndedState] =
    useState2<ChallengeCompleteMessage | null>(null)
  const [appState, setAppState] = useState2(async () => await appInitState(ctx))

  // These states are used to manage the reload process.
  const [isIframeMounted, setIsIframeMounted] = useState2(false)
  const [isWaitingToReload, setIsWaitingToReload] = useState2(false)

  const [showHowToPlay, setShowHowToPlay] = useState2(false)

  if (appState.status === 'needsToVerifyEmail') {
    return (
      <DialogVerifyEmail
        level={
          config2.levels.find(lvl => lvl.subredditId === ctx.subredditId)?.id ??
          0
        }
        pixelRatio={pixelRatio}
        onPress={async () => {
          console.log('to-do: not yet implemented!')
        }}
      />
    )
  }

  if (appState.status === 'notAllowed') {
    return (
      <DialogNotAllowed
        level={
          config2.levels.find(lvl => lvl.subredditId === ctx.subredditId)?.id ??
          0
        }
        pixelRatio={pixelRatio}
      />
    )
  }

  if (appState.status === 'dialog') {
    return (
      <DialogUnauthorized
        level={
          config2.levels.find(lvl => lvl.subredditId === ctx.subredditId)?.id ??
          0
        }
        currentLevel={appState.profile.currentLevel}
        redirectURL={appState.redirectURL}
        pixelRatio={pixelRatio}
      />
    )
  }

  const activePlayerInterval = useInterval(async () => {
    await activePlayersIncrement({
      redis: ctx.redis,
      team: appState.team,
    })
  }, 30_000)
  activePlayerInterval.start()

  // Since we can't circuit break in realtime, we need to use this hack
  // in order to know where the player needs to be after the challenge ends.
  //
  // TODO: This could be a perf problem and we had originally said a button click
  // would be required to do this. But, the comps want to show the computed state
  // as part of the dialog so we need to do this. If it's a problem, we need a
  // dialog that pops up on challenge complete and then a `Next` button that
  // makes this check and then a final state that shows the dialog.
  useAsync(
    async () => {
      if (!challengeEndedState) return null

      const profile = await userGet({
        redis: ctx.redis,
        userId: appState.profile.t2,
      })
      const result = await levelsIsUserInRightPlace({
        ctx,
        profile,
      })

      // If they pass for some reason, just do nothing
      if (result.pass) {
        iframe.postMessage({
          type: 'Dialog',
          code: 'ChallengeEndedStay',
          message:
            'This round has ended. Please refresh to begin the next round.',
          redirectURL: '',
          profile,
        }) //TODO: clean this up
        return null
      }

      const {pass: _pass, ...rest} = result

      iframe.postMessage(rest)

      return null
    },
    {
      depends: challengeEndedState,
      finally() {
        // Set back to null to handle this again when needed
        setChallengeEndedState(null)
      },
    },
  )

  const iframe = useWebView<IframeMessage, DevvitMessage>({
    onMessage: onMsg,
    onUnmount: () => {
      setIsIframeMounted(false)
      // If we were waiting for a reload when the user unmounts the iframe, then
      // we should just execute the reload immediately.
      if (isWaitingToReload) {
        reloadApp()
      }
    },
  })

  function reloadApp() {
    // "reload" by navigating to current level
    const currentUrl = config2.levels.find(
      lvl => lvl.subredditId === ctx.subredditId,
    )?.url
    ctx.ui.navigateTo(currentUrl || '')
  }

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
      initialMapKey,
      initialGlobalXY,
      initialCellsClaimed,
      visible,
      minesHitByTeam,
      team,
    } = state

    const p1 = {profile, sid: session.sid}

    const msg: InitDevvitMessage = {
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
      t5: state.level.subredditId,
      team,
      teamBoxCounts: initialCellsClaimed
        .sort((a, b) => a.member - b.member)
        .map(x => x.score) as TeamBoxCounts,
      type: 'Init',
      visible,
      initialGlobalXY,
      reinit,
    }
    if (initialMapKey) {
      msg.initialMapKey = initialMapKey
    }
    iframe.postMessage(msg)
  }

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
      case 'Loaded':
        setIsIframeMounted(true)
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
            iframe.postMessage(rest)
            return
          }

          const lastLevel = config2.levels.at(-1)!

          // Attempt to claim a global point if on the last level
          if (lastLevel.id === profile.currentLevel) {
            await userAttemptToClaimGlobalPointForTeam({
              ctx,
              userId: profile.t2,
            })

            iframe.postMessage({
              type: 'Dialog',
              message: 'Global point claimed!',
              code: 'GlobalPointClaimed',
              redirectURL: config2.levels[0]!.url,
            })

            return
          }

          const {newLevel, claimedCells, lostCells} = await fieldClaimCells({
            challengeNumber: appState.challengeNumber,
            coords: msg.boxes,
            ctx,
            userId: appState.profile.t2,
          })

          iframe.postMessage({type: 'Box', claimedCells, lostCells})

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
              iframe.postMessage({
                ...rest,
                // levelsIsUserInRightPlace doesn't have enough information to make
                // this determination so we stub it here
                code: 'ClaimedABanBox',
              })
              return
            }

            // They passed, so even though we got a new level, we let it ride
            // since the next tap will validate before submit
          }
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
        ctx.ui.navigateTo(config2.leaderboard.url)
        break
      case 'Dialog':
        ctx.ui.navigateTo(msg.redirectURL)
        break
      case 'OnClaimGlobalPointClicked':
        ctx.ui.navigateTo(config2.levels[0]!.url)
        break
      case 'ReloadApp': {
        reloadApp()
        break
      }
      case 'ChallengeComplete': {
        setChallengeEndedState(msg)
        break
      }

      default:
        msg satisfies never
    }
  }

  const chan = useChannel<RealtimeMessage>({
    name: INSTALL_REALTIME_CHANNEL,
    onMessage(msg) {
      if (session.debug)
        console.log(
          `${
            appState.status === 'pass'
              ? appState.profile.username
              : 'app state no pass'
          } Devvit ← realtime msg=${JSON.stringify(msg)}`,
        )

      if (
        msg.type === 'ConfigUpdate' &&
        msg.config.globalReloadSequence >
          appState.appConfig.globalReloadSequence &&
        appState.appConfig.globalReloadSequence > 0
      ) {
        // If globalReloadSequence has changed, schedule an event to reload the app.
        if (isIframeMounted) {
          setIsWaitingToReload(true)
          // Ideally, we schedule this sometime in the next 30 seconds (for jitter reasons),
          // but we can only use setTimeout if the iframe is mounted.
          const timeoutMillis = Math.floor(Math.random() * 30_000)
          iframe.postMessage({
            type: 'SetTimeout',
            timeoutMillis,
            message: {type: 'ReloadApp'},
          })
        } else {
          // without the iframe, we can't use setTimeout. just immediately reload.
          reloadApp()
        }

        // TODO: I think we want an early return here?
      }

      if (msg.type === 'ChallengeComplete') {
        const timeoutMillis = Math.floor(Math.random() * 15_000)
        console.log(`Challenge complete, handling in ${timeoutMillis}ms.`)
        iframe.postMessage({
          type: 'SetTimeout',
          message: msg,
          timeoutMillis,
        })
        return // Don't send the message to the iframe since we're forwarding above with a delay.
      }

      iframe.postMessage(msg)
    },
    onSubscribed: () => iframe.postMessage({type: 'Connected'}),
    onUnsubscribed: () => iframe.postMessage({type: 'Disconnected'}),
  })
  if (isLocal()) {
    chan.subscribe() // to-do: verify platform unsubscribes hidden posts.
  }

  if (showHowToPlay) {
    return (
      <DialogHowToPlay
        pixelRatio={pixelRatio}
        onPress={() => {
          setShowHowToPlay(false)
          iframe.mount()
        }}
      />
    )
  }

  return (
    <DialogWelcome
      team={getTeamFromUserId(session.t2)}
      level={
        config2.levels.find(lvl => lvl.subredditId === ctx.subredditId)?.id ?? 0
      }
      pixelRatio={pixelRatio}
      onPress={() =>
        appState.status === 'pass' && appState.profile.startedPlayingAt
          ? iframe.mount()
          : setShowHowToPlay(true)
      }
    />
  )
}
