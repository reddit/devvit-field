import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import type {Team} from '../../shared/team'
import {
  cssHex,
  fontLSize,
  fontSSize,
  paletteBlack,
  paletteWhite,
} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'
import {TeamBadge} from './TeamBadge'

type DialogWinnerProps = {
  team: Team
  level: Level
  pixelRatio: number
  onPress?: () => void
}

export function DialogWinner(props: DialogWinnerProps): JSX.Element {
  return (
    <Dialog
      {...props}
      buttonLabel={localize('winner-dialog-button-label')}
      marketingLabel={localize('winner-dialog-footer')}
    >
      <BorderedContainer
        height={80}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelHighlightColor[props.level])}
      >
        <PixelText
          {...props}
          size={fontLSize}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {localize('winner-dialog-title')}
        </PixelText>
      </BorderedContainer>

      <spacer grow />

      {localize('winner-dialog-metadata-1')
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

      {/* Team Badge */}

      <spacer size='small' />
      <TeamBadge {...props} />
      <spacer size='small' />

      {/* Team Overview */}

      <PixelText size={fontSSize} color={cssHex(paletteWhite)} {...props}>
        {localize('winner-dialog-metadata-2')}
      </PixelText>

      <spacer grow />
    </Dialog>
  )
}
