import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale.ts'
import {type Team, teamColor, teamTitleCase} from '../../shared/team.ts'
import {
  cssHex,
  fontMSize,
  fontSSize,
  paletteBlack,
  paletteConsole,
  paletteDisabled,
  paletteFieldLight,
  paletteOffline,
  paletteWhite,
} from '../../shared/theme.js'
import {PixelText} from './PixelText.js'
import {StyledButton} from './StyledButton.js'

type LeaderboardLoadingProps = {
  standings?: {
    member: Team
    score: number
  }[]
  pixelRatio: number
}

export function LeaderboardLoading(
  props: LeaderboardLoadingProps,
): JSX.Element {
  const standings = props.standings ?? [
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
        <spacer height='8px' />

        {/* Online Status */}
        <PixelText {...props} size={fontMSize} color={cssHex(paletteOffline)}>
          {`•${localize('leaderboard-offline')}`}
        </PixelText>
        <spacer height='24px' />

        <StyledButton width={200} {...props} color={cssHex(paletteDisabled)}>
          {localize('leaderboard-play-button-loading')}
        </StyledButton>
        <spacer height='24px' />

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
              color={cssHex(teamColor[team.member])}
              key={`team-${team.member}`}
            />
          ))}
        </hstack>
        <spacer height='24px' />

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
          <StatTile {...props} label={localize('leaderboard-stats-players')} />
          <StatTile {...props} label={localize('leaderboard-stats-bans')} />
          <StatTile {...props} label={localize('leaderboard-stats-fields')} />
        </hstack>

        <spacer height='24px' />

        {/* Data Link */}
        <spacer height='15px' />
      </vstack>
    </vstack>
  )
}

function TeamTile(props: {
  key: string
  label: string
  color: `#${string}`
  pixelRatio: number
}) {
  return (
    <vstack
      width='25%'
      height='52px'
      backgroundColor={props.color}
      alignment='center middle'
      key={props.key}
    >
      <spacer height='31px' />
      <PixelText
        pixelRatio={props.pixelRatio}
        size={fontSSize}
        color={cssHex(paletteBlack)}
      >
        {props.label}
      </PixelText>
    </vstack>
  )
}

function StatTile(props: {label: string; pixelRatio: number}) {
  return (
    <vstack
      width='33.332%'
      height='52px'
      backgroundColor={cssHex(paletteBlack)}
      alignment='center middle'
      border='thin'
      borderColor={cssHex(paletteFieldLight)}
    >
      <spacer height='31px' />
      <PixelText
        pixelRatio={props.pixelRatio}
        size={fontSSize}
        color={cssHex(paletteFieldLight)}
      >
        {props.label}
      </PixelText>
    </vstack>
  )
}
