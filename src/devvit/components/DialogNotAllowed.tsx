import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
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
        {[
          localize('not-allowed-dialog-line-0'),
          localize('not-allowed-dialog-line-1'),
        ].map(copy => (
          <PixelText
            key={copy}
            {...props}
            size={24}
            color={cssHex(levelHighlightColor[props.level])}
          >
            {copy}
          </PixelText>
        )) ?? null}
      </BorderedContainer>
    </Dialog>
  )
}
