import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import type {Team} from '../../shared/team'
import {
  cssHex,
  fontMSize,
  fontSSize,
  paletteBlack,
  paletteWhite,
} from '../../shared/theme'
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
import {TeamBadge} from './TeamBadge'

// This dialog is shown whenever a user transitions to a new level.
// It displays the team the user is on and their current field standings.
// Clicking the play button opens the web view full screen.

type DialogWelcomeProps = {
  team: Team
  level: Level
  pixelRatio: number
  onPress?: () => void
}

export function DialogWelcome(props: DialogWelcomeProps): JSX.Element {
  const levelName = levelPascalCase[props.level]

  return (
    <Dialog
      {...props}
      buttonLabel={
        props.level === 0
          ? localize('welcome-dialog-button-label-first')
          : `${localize(
              'welcome-dialog-button-label-subsequent',
            )} r/${levelName}`
      }
      backgroundElement={<GameScreen {...props} />}
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
          size={fontMSize}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {localize('welcome-dialog-greeting')}
        </PixelText>
        <PixelText
          {...props}
          size={22}
          color={cssHex(levelHighlightColor[props.level])}
        >
          {`r/${levelName}`}
        </PixelText>
      </BorderedContainer>

      {/* Magic number to match graphic bottom border */}
      <spacer height='10px' />

      <spacer grow />

      {props.level === 0 && (
        <>
          <PixelText size={fontMSize} color={cssHex(paletteWhite)} {...props}>
            {localize('welcome-dialog-team-allocation')}
          </PixelText>
          <spacer size='small' />
        </>
      )}

      <TeamBadge {...props} />

      {props.level > 0 && (
        <>
          <spacer size='small' />
          <vstack width='100%' alignment='center middle'>
            <PixelText size={fontSSize} color={cssHex(paletteWhite)} {...props}>
              {localize('welcome-dialog-team-standing')}
            </PixelText>
            {/* to-do: add actual data */}
            <PixelText size={20} color={cssHex(paletteWhite)} {...props}>
              3rd
            </PixelText>
          </vstack>
        </>
      )}

      <spacer grow />
    </Dialog>
  )
}
