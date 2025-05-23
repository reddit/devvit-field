import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import {cssHex, fontMSize, paletteBlack} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogErrorProps = {
  pixelRatio: number
  level: Level
  onPress: () => void
}

export function DialogError(props: DialogErrorProps): JSX.Element {
  return (
    <Dialog {...props} marketing={false} onPress={props.onPress}>
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelHighlightColor[props.level])}
      >
        {localize('error-dialog')
          .split(lineBreakToken)
          .map(copy => (
            <PixelText
              {...props}
              key={copy}
              size={fontMSize}
              color={cssHex(levelHighlightColor[props.level])}
            >
              {copy}
            </PixelText>
          )) ?? null}
      </BorderedContainer>
    </Dialog>
  )
}
