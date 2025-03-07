import {Devvit} from '@devvit/public-api'
import type {Team} from '../../shared/team'
import {cssHex, paletteBlack, paletteWhite} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
  levelPascalCase,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {GameScreen} from './GameScreen'
import {PixelText} from './PixelText'

// This dialog is shown whenever a user transitions to a new level.
// It displays the team the user is on and their current field standings.
// Clicking the play button opens the web view full screen.

type DialogBannedProps = {
  level: Level
  team: Team
  targetLevel: Level
  pixelRatio: number
  onPress?: () => void
}

export function DialogBanned(props: DialogBannedProps): JSX.Element {
  return (
    <Dialog
      {...props}
      buttonLabel={`Go to r/${levelPascalCase[props.targetLevel]}`}
      backgroundElement={
        <GameScreen
          level={props.level}
          team={props.team}
          pixelRatio={props.pixelRatio}
        />
      }
    >
      <BorderedContainer
        height={96}
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
          YOU CLAIMED
        </PixelText>
        <PixelText
          {...props}
          size={24}
          color={cssHex(levelHighlightColor[props.level])}
        >
          A BAN BOX!
        </PixelText>
      </BorderedContainer>

      {/* Magic number to match graphic bottom border */}
      <spacer height='10px' />

      <spacer grow />
      <PixelText size={12} color={cssHex(paletteWhite)} {...props}>
        YOU HAVE BEEN BANNED FROM
      </PixelText>
      <PixelText size={24} color={cssHex(paletteWhite)} {...props}>
        {`r/${levelPascalCase[props.level]}`}
      </PixelText>

      <spacer height='8px' />
      <PixelText size={12} color={cssHex(paletteWhite)} {...props}>
        However... There's something
      </PixelText>
      <PixelText size={12} color={cssHex(paletteWhite)} {...props}>
        you might like to see.
      </PixelText>

      <spacer grow />
    </Dialog>
  )
}
