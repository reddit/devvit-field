import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {
  cssHex,
  fontLSize,
  fontMSize,
  paletteBlack,
  paletteDisabled,
} from '../../shared/theme'
import {
  type Level,
  levelHighlightColor,
  levelPascalCase,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogWelcomeLoadingProps = {
  level: Level
  pixelRatio: number
}

export function DialogWelcomeLoading(
  props: DialogWelcomeLoadingProps,
): JSX.Element {
  const levelName = levelPascalCase[props.level]

  return (
    <Dialog
      {...props}
      buttonLabel={localize('welcome-dialog-button-label-loading')}
      buttonColor={cssHex(paletteDisabled)}
    >
      <BorderedContainer
        height={72}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelHighlightColor[props.level])}
      >
        <PixelText
          {...props}
          size={fontMSize}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {localize('welcome-dialog-button-label-loading')}
        </PixelText>
        <PixelText
          {...props}
          size={fontLSize}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {`r/${levelName}`}
        </PixelText>
      </BorderedContainer>

      <spacer grow />
    </Dialog>
  )
}
