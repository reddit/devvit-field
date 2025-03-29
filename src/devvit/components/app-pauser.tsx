import {type Context, Devvit, useInterval} from '@devvit/public-api'
import {fallbackPixelRatio} from '../../shared/theme.ts'
import {config2} from '../../shared/types/level.ts'
import {useState2} from '../hooks/use-state2.ts'
import {appInitState} from '../server/core/app.js'
import {DialogPaused} from './DialogPaused.tsx'
import {App} from './app.tsx'

export function AppPauser(ctx: Context): JSX.Element {
  const [paused, setPaused] = useState2(false)
  const pauseInterval = useInterval(() => {
    pauseInterval.stop()
    setPaused(true)
  }, 300)

  if (paused)
    return (
      <DialogPaused
        level={
          config2.levels.find(lvl => lvl.subredditId === ctx.subredditId)?.id ??
          0
        }
        pixelRatio={ctx.uiEnvironment?.dimensions?.scale ?? fallbackPixelRatio}
        onPress={async () => {
          // TODO: There's a perf opportunity here to pass this to the App component
          // so that it doesn't make this call again in the initializer for appState
          const appState = await appInitState(ctx)

          switch (appState.status) {
            // Means they're on the right level, just reinit the entire app
            case 'pass':
            // If they beat the game, just render the app
            case 'beatTheGame':
            // If they need to verify their email, just render the app
            case 'needsToVerifyEmail':
            // If they aren't allowed, just render the app
            case 'notAllowed':
              setPaused(false)
              break
            // If we are supposed to render a dialog, short cut and use the
            // redirect URL to get them there faster
            case 'dialog':
              ctx.ui.navigateTo(appState.redirectURL)
              break

            default:
              appState satisfies never
          }
        }}
      />
    )

  return App(ctx, pauseInterval)
}
