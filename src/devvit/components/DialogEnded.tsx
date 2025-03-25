import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import type {Team} from '../../shared/team'
import {
  cssHex,
  fontLSize,
  fontMSize,
  paletteBlack,
  paletteWhite,
} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogEndedProps = {
  team: Team
  level: Level
  pixelRatio: number
  onPress?: () => void
}

export function DialogEnded(props: DialogEndedProps): JSX.Element {
  return (
    <Dialog {...props} buttonLabel={localize('ended-dialog-button-label')}>
      <BorderedContainer
        height={128}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelHighlightColor[props.level])}
      >
        <PixelText
          {...props}
          size={fontLSize}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {localize('ended-dialog-title')}
        </PixelText>
      </BorderedContainer>

      <spacer grow />

      {localize('ended-dialog-metadata')
        .split(lineBreakToken)
        .map(line => (
          <PixelText
            key={line}
            size={fontMSize}
            color={cssHex(paletteWhite)}
            {...props}
          >
            {line}
          </PixelText>
        ))}

      <spacer grow />
    </Dialog>
  )
}
