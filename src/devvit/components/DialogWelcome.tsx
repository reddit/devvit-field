import {Devvit} from '@devvit/public-api'
import {hydrateString} from '../../shared/format'
import {lineBreakToken, localize} from '../../shared/locale'
import {type Team, teamColor, teamTitleCase} from '../../shared/team'
import {cssHex, fontMSize, paletteBlack, paletteWhite} from '../../shared/theme'
import {
  type Level,
  levelHighlightColor,
  levelPascalCase,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'
import {TeamBadge} from './TeamBadge'

/*
 * This dialog is shown whenever a user transitions to a new level.
 * On the first level it shows a greeting and the team assignment.
 * On subsequent levels it shows a greeting and mentions acension.
 * Clicking the button opens the web view full screen.
 */

type DialogWelcomeProps = {
  team: Team
  level: Level
  pixelRatio: number
  onPress?: () => void
}

export function DialogWelcome(props: DialogWelcomeProps): JSX.Element {
  const levelName = levelPascalCase[props.level]

  const opponentTeams = [0, 1, 2, 3].filter(
    team => team !== props.team,
  ) as Team[]

  return (
    <Dialog
      {...props}
      buttonLabel={
        props.level === 0
          ? localize('welcome-dialog-button-label-first')
          : hydrateString(localize('welcome-dialog-button-label-subsequent'), {
              rSlashSubredditName: `r/${levelName}`,
            })
      }
    >
      <BorderedContainer
        height={72}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelHighlightColor[props.level])}
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

      <spacer grow />

      {props.level === 0 && (
        <>
          {localize('welcome-dialog-team-allocation')
            .split(lineBreakToken)
            .map(line => (
              <PixelText
                key={line}
                size={12}
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

          <PixelText size={12} color={cssHex(paletteWhite)} {...props}>
            {localize('welcome-dialog-team-overview')}
          </PixelText>
          <hstack>
            <PixelText
              size={12}
              color={cssHex(teamColor[opponentTeams[0]!])}
              {...props}
            >
              {teamTitleCase[opponentTeams[0]!].toUpperCase()}
            </PixelText>
            <PixelText size={12} color={cssHex(paletteWhite)} {...props}>
              {', '}
            </PixelText>
            <PixelText
              size={12}
              color={cssHex(teamColor[opponentTeams[1]!])}
              {...props}
            >
              {teamTitleCase[opponentTeams[1]!].toUpperCase()}
            </PixelText>
            <PixelText size={12} color={cssHex(paletteWhite)} {...props}>
              {', & '}
            </PixelText>
            <PixelText
              size={12}
              color={cssHex(teamColor[opponentTeams[2]!])}
              {...props}
            >
              {teamTitleCase[opponentTeams[2]!].toUpperCase()}
            </PixelText>
          </hstack>
        </>
      )}

      {props.level > 0 && (
        <>
          <spacer size='small' />
          <vstack width='100%' alignment='center middle'>
            {hydrateString(localize('welcome-dialog-rules'), {
              rSlashSubredditName: `r/${levelPascalCase[(props.level - 1) as Level]}`,
            })
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
          </vstack>
        </>
      )}

      <spacer grow />
    </Dialog>
  )
}
