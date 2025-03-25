import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import {cssHex, fontLSize, paletteBlack} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'
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
        borderColor={cssHex(levelHighlightColor[props.level])}
      >
        {localize('not-allowed-dialog')
          .split(lineBreakToken)
          .map(copy => (
            <PixelText
              key={copy}
              {...props}
              size={fontLSize}
              color={cssHex(levelHighlightColor[props.level])}
            >
              {copy}
            </PixelText>
          )) ?? null}
      </BorderedContainer>
    </Dialog>
  )
}
