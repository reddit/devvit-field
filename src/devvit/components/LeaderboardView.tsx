import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale.ts'
import {type Team, teamColor, teamTitleCase} from '../../shared/team.ts'
import {
  cssHex,
  fontMSize,
  paletteBlack,
  paletteConsole,
  paletteWhite,
} from '../../shared/theme.js'
import {PixelText} from './PixelText.js'
import {StatTile} from './StatTile.tsx'
import {StyledButton} from './StyledButton.js'
import {TeamTile} from './TeamTile.tsx'

type LeaderboardViewProps = {
  standings?: {
    member: Team
    score: number
  }[]
  players?: number
  bans?: number
  fields?: number
  pixelRatio: number
  showPlayButton: boolean
  onPlay: () => void
  onSubscribe: () => void
}

export function LeaderboardView(props: LeaderboardViewProps): JSX.Element {
  const standings = props.standings?.sort((a, b) => a.member - b.member) ?? [
    {member: 0, score: 0},
    {member: 1, score: 0},
    {member: 2, score: 0},
    {member: 3, score: 0},
  ]

  return (
    <vstack
      height='100%'
      width='100%'
      backgroundColor={cssHex(paletteConsole)}
      padding='medium'
    >
      {/* Inset Border */}
      <vstack
        height='100%'
        width='100%'
        padding='medium'
        border='thin'
        borderColor={cssHex(paletteBlack)}
        cornerRadius='medium'
        alignment='center middle'
      >
        {/* Field Logo */}
        <image
          imageHeight='264px'
          imageWidth='900px'
          width='100%'
          height='60px'
          description='r/Field Logo'
          url='field-logo-dark.png'
          resizeMode='fit'
        />

        <spacer height='32px' />

        {props.showPlayButton && (
          <>
            <StyledButton width={256} {...props} onPress={props.onPlay}>
              Play r/Field
            </StyledButton>
            <spacer height='32px' />
          </>
        )}

        <PixelText
          {...props}
          size={fontMSize}
          color={cssHex(paletteWhite)}
          underline
        >
          {localize('leaderboard-teams-header')}
        </PixelText>
        <spacer height='8px' />
        <hstack width='100%' gap='small' alignment='center'>
          {standings.map(team => (
            <TeamTile
              {...props}
              label={teamTitleCase[team.member]}
              value={team.score}
              color={cssHex(teamColor[team.member])}
              key={`team-${team.member}`}
            />
          ))}
        </hstack>
        <spacer height='32px' />

        <PixelText
          {...props}
          size={fontMSize}
          color={cssHex(paletteWhite)}
          underline
        >
          {localize('leaderboard-stats-header')}
        </PixelText>
        <spacer height='8px' />
        <hstack width='100%' gap='small' alignment='center'>
          <StatTile
            {...props}
            label={localize('leaderboard-stats-players')}
            value={props.players ?? 0}
          />
          <StatTile
            {...props}
            label={localize('leaderboard-stats-bans')}
            value={props.bans ?? 0}
          />
          <StatTile
            {...props}
            label={localize('leaderboard-stats-fields')}
            value={props.fields ?? 0}
          />
        </hstack>

        {!props.showPlayButton && (
          <>
            <spacer height='32px' />
            <StyledButton
              pixelRatio={props.pixelRatio}
              width={256}
              color={cssHex(paletteWhite)}
              onPress={props.onSubscribe}
            >
              Join r/GamesOnReddit
            </StyledButton>
          </>
        )}
      </vstack>
    </vstack>
  )
}
