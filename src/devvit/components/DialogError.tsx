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
}

export function DialogError(props: DialogErrorProps): JSX.Element {
  const sharedProps = {
    size: fontMSize,
    color: cssHex(levelHighlightColor[props.level]),
    ...props,
  }

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
        {localize('error-dialog')
          .split(lineBreakToken)
          .map(copy => (
            <PixelText key={copy} {...sharedProps}>
              {copy}
            </PixelText>
          )) ?? null}
      </BorderedContainer>
    </Dialog>
  )
}
