import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {cssHex, paletteBlack, paletteDisabled} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'

type DialogWelcomeLoadingProps = {
  level: Level
  pixelRatio: number
}

export function DialogWelcomeLoading(
  props: DialogWelcomeLoadingProps,
): JSX.Element {
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
        <hstack />
      </BorderedContainer>

      <spacer grow />
    </Dialog>
  )
}
