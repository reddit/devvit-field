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
      marketingLabel={localize('winner-dialog-footer')}
      button={false}
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

      <spacer height='4px' />
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

      <spacer grow />

      <TeamBadge {...props} />

      <spacer grow />

      {/* Team Overview */}

      {localize('winner-dialog-metadata-2')
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

      <spacer grow />
    </Dialog>
  )
}
