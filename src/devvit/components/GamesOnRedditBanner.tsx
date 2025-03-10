import {type Context, Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale.ts'
import {cssHex, paletteWhite} from '../../shared/theme.ts'
import {type Level, config} from '../../shared/types/level.ts'
import {PixelText} from './PixelText.tsx'

type GamesOnRedditBannerProps = {
  pixelRatio: number
  level: Level
}

export function GamesOnRedditBanner(
  props: GamesOnRedditBannerProps,
  context: Context,
): JSX.Element {
  return (
    <vstack
      width='100%'
      alignment='center middle'
      onPress={() => context.ui.navigateTo(config.leaderboard.url)}
    >
      <PixelText {...props} size={12} color={cssHex(paletteWhite)}>
        {localize('games-on-reddit-header')}
      </PixelText>
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
