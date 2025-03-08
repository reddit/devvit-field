import {Devvit} from '@devvit/public-api'
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
    <Dialog {...props} buttonLabel='CHECK AGAIN'>
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        <PixelText
          {...props}
          size={24}
          color={cssHex(levelHighlightColor[props.level])}
        >
          Please verify
        </PixelText>
        <PixelText
          {...props}
          size={24}
          color={cssHex(levelHighlightColor[props.level])}
        >
          your email
        </PixelText>
        <PixelText
          {...props}
          size={24}
          color={cssHex(levelHighlightColor[props.level])}
        >
          to continue
        </PixelText>
      </BorderedContainer>
    </Dialog>
  )
}
