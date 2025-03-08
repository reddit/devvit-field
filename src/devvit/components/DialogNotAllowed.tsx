import {Devvit} from '@devvit/public-api'
import {cssHex, paletteBlack} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogNotAllowedProps = {
  pixelRatio: number
  level: Level
}

export function DialogNotAllowed(props: DialogNotAllowedProps): JSX.Element {
  return (
    <Dialog {...props} button={false} marketing={false}>
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        <PixelText
          {...props}
          size={24}
          color={cssHex(levelHighlightColor[props.level])}
        >
          ACCESS
        </PixelText>
        <PixelText
          {...props}
          size={24}
          color={cssHex(levelHighlightColor[props.level])}
        >
          DENIED
        </PixelText>
      </BorderedContainer>
    </Dialog>
  )
}
