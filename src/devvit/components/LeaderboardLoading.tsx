import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale.ts'
import {type Team, teamColor} from '../../shared/team.ts'
import {
  cssHex,
  fontMSize,
  paletteBlack,
  paletteConsole,
  paletteDisabled,
  paletteFieldLight,
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

  const placeholderStat = (
    <vstack
      width='33.332%'
      height='52px'
      backgroundColor={cssHex(paletteBlack)}
      border='thin'
      borderColor={cssHex(paletteFieldLight)}
    />
  )

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

        <StyledButton width={200} {...props} color={cssHex(paletteDisabled)}>
          {localize('leaderboard-play-button-loading')}
        </StyledButton>
        <spacer height='32px' />

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
            <vstack
              width='25%'
              height='52px'
              backgroundColor={cssHex(teamColor[team.member])}
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
          {placeholderStat}
          {placeholderStat}
          {placeholderStat}
        </hstack>
      </vstack>
    </vstack>
  )
}
