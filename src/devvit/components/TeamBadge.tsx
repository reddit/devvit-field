import {Devvit, svg} from '@devvit/public-api'
import {createTeamBadgeBackground} from '../../shared/svg-factories/createTeamBadgeBackground'
import {type Team, teamTitleCase} from '../../shared/team'
import {cssHex, paletteWhite} from '../../shared/theme'
import {PixelText, getBoundingBoxWidth} from './PixelText'

type TeamBadgeProps = {
  team: Team
  pixelRatio: number
}

export function TeamBadge(props: TeamBadgeProps): JSX.Element {
  const MARGIN = 20
  const TEXT_SIZE = 16
  const CAP_WIDTH = 12
  const teamName = teamTitleCase[props.team].toUpperCase()
  const textWidth = getBoundingBoxWidth(teamName, TEXT_SIZE)
  const width = Math.ceil(textWidth + MARGIN * 2 + CAP_WIDTH * 2)
  const height = 38

  return (
    <zstack alignment='center middle'>
      {/* Background */}
      <image
        imageWidth={width * props.pixelRatio}
        imageHeight={height * props.pixelRatio}
        width={`${width}px`}
        height={`${height}px`}
        resizeMode='fill'
        description='Team Badge Background'
        url={svg`${createTeamBadgeBackground(props.team, width)}`}
      />

      {/* Text */}
      <PixelText {...props} size={TEXT_SIZE} color={cssHex(paletteWhite)}>
        {teamName}
      </PixelText>
    </zstack>
  )
}
