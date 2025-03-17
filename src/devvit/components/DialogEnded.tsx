import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import type {Team} from '../../shared/team'
import {cssHex, fontMSize, paletteBlack, paletteWhite} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {GameScreen} from './GameScreen'
import {PixelText} from './PixelText'

type DialogEndedProps = {
  team: Team
  level: Level
  pixelRatio: number
  onPress?: () => void
}

export function DialogEnded(props: DialogEndedProps): JSX.Element {
  return (
    <Dialog
      {...props}
      buttonLabel={localize('ended-dialog-button-label')}
      backgroundElement={<GameScreen {...props} />}
    >
      <BorderedContainer
        height={128}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        <PixelText
          {...props}
          size={22}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {localize('ended-dialog-title')}
        </PixelText>
      </BorderedContainer>

      <spacer grow />

      {localize('ended-dialog-metadata')
        .split(lineBreakToken)
        .map(line => (
          <PixelText
            key={line}
            size={fontMSize}
            color={cssHex(paletteWhite)}
            {...props}
          >
            {line}
          </PixelText>
        ))}

      <spacer grow />
    </Dialog>
  )
}
