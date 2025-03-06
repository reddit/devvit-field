import {Devvit} from '@devvit/public-api'
import type {Team} from '../../shared/team'
import {
  consoleBase,
  cssHex,
  fallbackPixelRatio,
  fontMSize,
  fontSSize,
  paletteBlack,
  paletteFieldLight,
  paletteWhite,
} from '../../shared/theme'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'
import {TeamBadge} from './TeamBadge'

type IntroductionViewProps = {
  team: Team
  pixelRatio?: number
}

export function IntroductionView(props: IntroductionViewProps): JSX.Element {
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio
  return (
    <zstack
      height='100%'
      width='100%'
      alignment='center middle'
      backgroundColor={cssHex(consoleBase)}
    >
      {/* Background */}
      {/* to-do: add representation of base screen here */}

      {/* Content */}
      <Dialog
        onPress={() => console.log('do something')}
        pixelRatio={pixelRatio}
        buttonLabel='OK'
      >
        <BorderedContainer
          height={96}
          width={256}
          pixelRatio={pixelRatio}
          lines
          backgroundColor={cssHex(paletteBlack)}
        >
          <PixelText
            pixelRatio={pixelRatio}
            size={fontMSize}
            color={cssHex(paletteFieldLight)}
          >
            WELCOME TO
          </PixelText>
          <PixelText
            pixelRatio={pixelRatio}
            size={32}
            color={cssHex(paletteFieldLight)}
          >
            r/Field
          </PixelText>
        </BorderedContainer>

        <spacer grow />

        <PixelText
          size={fontMSize}
          color={cssHex(paletteWhite)}
          pixelRatio={pixelRatio}
        >
          YOU ARE ON TEAM
        </PixelText>

        <spacer height='8px' />

        <TeamBadge team={props.team} pixelRatio={pixelRatio} />

        <spacer grow />

        <PixelText
          size={fontSSize}
          color={cssHex(paletteWhite)}
          pixelRatio={pixelRatio}
        >
          CLAIM WHAT YOU CAN. BEWARE OF THE BAN
        </PixelText>
      </Dialog>
    </zstack>
  )
}
