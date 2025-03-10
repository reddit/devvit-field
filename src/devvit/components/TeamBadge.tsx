import {Devvit} from '@devvit/public-api'
import {type Team, teamColor, teamTitleCase} from '../../shared/team'
import {cssHex, paletteWhite} from '../../shared/theme'
import {PixelText, getTextSize} from './PixelText'

type TeamBadgeProps = {
  team: Team
  pixelRatio: number
}

export function TeamBadge(props: TeamBadgeProps): JSX.Element {
  const MARGIN = 20
  const TEXT_SIZE = 20

  const backgroundColor = cssHex(teamColor[props.team])
  const teamName = teamTitleCase[props.team]
  const textWidth = getTextSize(teamName, TEXT_SIZE).width
  const middleSegmentWidth = Math.ceil(textWidth + MARGIN * 2)
  const height = 40

  return (
    <hstack>
      {/* Left Cap */}
      <image
        imageHeight={height * props.pixelRatio}
        imageWidth={9 * props.pixelRatio}
        width='9px'
        height={`${height}px`}
        resizeMode='fill'
        description='Team Badge: Left End Cap'
        url={`data:image/svg+xml;charset=UTF-8,
      <svg width="9" height="40" viewBox="0 0 9 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 0V3H3V6H0V31H3V34H6V37H9V0H6Z" fill="${backgroundColor}"/>
<path d="M6 0V3H3V6H0V31H3V34H6V37H9V31H6V28H3V9H6V6H9V0H6Z" fill="white" fill-opacity="0.6"/>
</svg>`}
      />

      {/* Middle */}
      <zstack
        alignment='center middle'
        height='40px'
        width={`${middleSegmentWidth}px`}
      >
        {/* Background */}
        <image
          imageWidth={middleSegmentWidth * props.pixelRatio}
          imageHeight={height * props.pixelRatio}
          width={`${middleSegmentWidth}px`}
          height={`${height}px`}
          resizeMode='fill'
          description='Team Badge - Middle Section'
          url={`data:image/svg+xml;charset=UTF-8,
      <svg width="${middleSegmentWidth}" height="40" viewBox="0 0 ${middleSegmentWidth} 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0H${middleSegmentWidth}V37H0V0Z" fill="${backgroundColor}"/>
<path d="M3 0H0V3H${middleSegmentWidth}V0Z" fill="white" fill-opacity="0.6"/>
<path d="M3 34H0V37H${middleSegmentWidth}V34Z" fill="white" fill-opacity="0.6"/>
<path d="M0 37H${middleSegmentWidth}V40H0V37Z" fill="#05131D"/>
</svg>`}
        />

        {/* Text */}
        <vstack height='100%' width='100%' alignment='top center'>
          <spacer height='4px' />
          <PixelText {...props} size={TEXT_SIZE} color={cssHex(paletteWhite)}>
            {teamName}
          </PixelText>
        </vstack>
      </zstack>

      {/* Right Cap */}
      <image
        imageHeight={height * props.pixelRatio}
        imageWidth={12 * props.pixelRatio}
        width='12px'
        height={`${height}px`}
        resizeMode='fill'
        description='Team Badge: Right End Cap'
        url={`data:image/svg+xml;charset=UTF-8,
      <svg width="12" height="40" viewBox="0 0 12 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 37V34H6V31H9V6H6V3H3V0H0V37H3Z" fill="${backgroundColor}"/>
<path d="M3 3V0H0V6H3V9H6V28H3V31H0V37H3V34H6V31H9V6H6V3H3Z" fill="white" fill-opacity="0.6"/>
<path d="M12 6H9V31H6V34H3V37H0V40H6V37H9V34H12V6Z" fill="#05131D"/>
</svg>`}
      />
    </hstack>
  )
}
