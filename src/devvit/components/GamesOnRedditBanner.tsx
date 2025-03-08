import {type Context, Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {cssHex, paletteWhite} from '../../shared/theme'
import type {Level} from '../../shared/types/level'
import {PixelText} from './PixelText'

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
      onPress={() =>
        context.ui.navigateTo('https://www.reddit.com/r/GamesOnReddit/')
      }
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
