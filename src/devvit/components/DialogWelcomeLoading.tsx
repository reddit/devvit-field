import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {
  cssHex,
  fontMSize,
  fontSSize,
  paletteBlack,
  paletteDisabled,
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
import {PixelText} from './PixelText'

// This dialog is shown whenever a user transitions to a new level.
// It displays the team the user is on and their current field standings.
// Clicking the play button opens the web view full screen.

type DialogWelcomeLoadingProps = {
  level: Level
  pixelRatio: number
}

export function DialogWelcomeLoading(
  props: DialogWelcomeLoadingProps,
): JSX.Element {
  const levelName = levelPascalCase[props.level]

  return (
    <Dialog
      {...props}
      buttonLabel={localize('welcome-dialog-button-label-loading')}
      buttonColor={cssHex(paletteDisabled)}
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

      {/* TeamBadge placeholder */}
      <spacer height='40px' />

      {props.level > 0 && (
        <>
          <spacer size='small' />
          <vstack width='100%' alignment='center middle'>
            <PixelText size={fontSSize} color={cssHex(paletteWhite)} {...props}>
              {localize('welcome-dialog-team-standing')}
            </PixelText>
            {/* to-do: add actual data */}
            {/* Team Standing Placeholder */}
            <spacer height='25px' />
          </vstack>
        </>
      )}

      <spacer grow />
    </Dialog>
  )
}
