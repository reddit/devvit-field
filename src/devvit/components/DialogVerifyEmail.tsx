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
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        {localize('verify-email-dialog')
          .split('↵')
          .map(copy => (
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
