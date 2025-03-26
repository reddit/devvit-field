import {type Context, Devvit, svg} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale.ts'
import {createGorLogo} from '../../shared/svg-factories/createGorLogo.ts'
import {cssHex, fontSSize, paletteWhite} from '../../shared/theme.ts'
import {config2} from '../../shared/types/level.ts'
import {PixelText} from './PixelText.tsx'

type GamesOnRedditBannerProps = {
  pixelRatio: number
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
        <PixelText
          {...props}
          key={line}
          size={fontSSize}
          color={cssHex(paletteWhite)}
        >
          {line}
        </PixelText>
      ))}

      <spacer height='8px' />

      <image
        imageWidth={173 * props.pixelRatio}
        imageHeight={32 * props.pixelRatio}
        width='173px'
        height='32px'
        description='r/GamesOnReddit Logo'
        resizeMode='fit'
        url={svg`${createGorLogo()}`}
      />
    </vstack>
  )
}
