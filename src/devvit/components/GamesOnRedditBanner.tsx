import {type Context, Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale.ts'
import {cssHex, paletteWhite} from '../../shared/theme.ts'
import {type Level, config2} from '../../shared/types/level.ts'
import {PixelText} from './PixelText.tsx'

type GamesOnRedditBannerProps = {
  pixelRatio: number
  level: Level
  label?: string
}

export function GamesOnRedditBanner(
  props: GamesOnRedditBannerProps,
  context: Context,
): JSX.Element {
  const label = props.label ? props.label : localize('games-on-reddit-header')

  return (
    <vstack
      width='100%'
      alignment='center middle'
      onPress={() => context.ui.navigateTo(config2.leaderboard.url)}
    >
      {label.split(lineBreakToken).map(line => (
        <PixelText {...props} key={line} size={12} color={cssHex(paletteWhite)}>
          {line}
        </PixelText>
      ))}

      <image
        imageWidth='680px'
        imageHeight='80px'
        width='256px'
        height='40px'
        description='r/GamesOnReddit Logo'
        resizeMode='fit'
        url={`gor-${props.level}.png`}
      />
    </vstack>
  )
}
