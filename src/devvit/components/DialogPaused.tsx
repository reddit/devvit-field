import {type Context, Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import {
  cssHex,
  fontMSize,
  fontSSize,
  paletteBlack,
  paletteWhite,
} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'

import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogUnauthorizedProps = {
  pixelRatio: number
  level: Level
  onPress: () => void | Promise<void>
}

export function DialogPaused(
  props: DialogUnauthorizedProps,
  _ctx: Context,
): JSX.Element {
  return (
    <Dialog {...props} buttonLabel={localize('paused-dialog-button-label')}>
      <BorderedContainer
        height={180}
        width={256}
        {...props}
        lines
        padding='none'
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelHighlightColor[props.level])}
      >
        <PixelText
          {...props}
          size={fontMSize}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {localize('paused-dialog-header')}
        </PixelText>
        <spacer size='small' />
        {localize('paused-dialog-metadata')
          .split(lineBreakToken)
          .map(line => (
            <PixelText
              key={line}
              size={fontSSize}
              color={cssHex(paletteWhite)}
              {...props}
            >
              {line}
            </PixelText>
          ))}
      </BorderedContainer>
      <spacer height='4px' />
      <spacer grow />
    </Dialog>
  )
}
