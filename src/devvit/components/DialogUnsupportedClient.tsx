import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import {cssHex, paletteBlack} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogUnsupportedClientProps = {
  pixelRatio: number
  level: Level
}

export function DialogUnsupportedClient(
  props: DialogUnsupportedClientProps,
): JSX.Element {
  const size = 16
  const sharedProps = {
    size,
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
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        {localize('unsupported-client-dialog')
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
