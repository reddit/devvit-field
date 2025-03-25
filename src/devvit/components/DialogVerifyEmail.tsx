import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import {cssHex, fontMSize, paletteBlack} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogVerifyEmailProps = {
  pixelRatio: number
  level: Level
  onPress: () => void
}

export function DialogVerifyEmail(props: DialogVerifyEmailProps): JSX.Element {
  return (
    <Dialog
      {...props}
      buttonLabel={localize('verify-email-dialog-button-label')}
    >
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelHighlightColor[props.level])}
      >
        {localize('verify-email-dialog')
          .split(lineBreakToken)
          .map(copy => (
            <PixelText
              key={copy}
              {...props}
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
