import {Devvit, svg} from '@devvit/public-api'
import {abbreviateNumber} from '../../../shared/format'
import {localize} from '../../../shared/locale'
import {type Team, teamColor} from '../../../shared/team'
import {
  cssHex,
  paletteBlack,
  paletteConsole,
  paletteShade50,
  paletteWhite,
} from '../../../shared/theme'
import {PixelText} from '../PixelText'

type FooterProps = {
  pixelRatio: number
  onPress?: () => void
  scores: {team: Team; score: number}[]
}

export function Footer(props: FooterProps): JSX.Element {
  const CAP_HEIGHT = 128
  const CAP_WIDTH = 48
  const RADIUS = 8

  const leftOuterBorderSegments = [
    `M${CAP_WIDTH},0`,
    'H0',
    `V${CAP_HEIGHT - RADIUS}`,
    `Q0,${CAP_HEIGHT} ${RADIUS},${CAP_HEIGHT}`,
    `H${CAP_WIDTH}`,
  ]

  const leftInsetContainerSegments = [
    `M${CAP_WIDTH},8`,
    `H${8 + RADIUS}`,
    `Q8,8 8,${8 + RADIUS}`,
    `V${96 - RADIUS}`,
    `Q8,${96} ${RADIUS},${96}`,
    `H${CAP_WIDTH}`,
  ]

  const rightOuterBorderSegments = [
    'M0,0',
    `H${CAP_WIDTH}`,
    `V${CAP_HEIGHT - RADIUS}`,
    `Q${CAP_WIDTH},${CAP_HEIGHT} ${CAP_WIDTH - RADIUS},${CAP_HEIGHT}`,
    'H0',
  ]

  const background = (
    <hstack height={`${CAP_HEIGHT}px`} width='100%'>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height='100%'
        description='Background: Left Cap'
        url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${leftOuterBorderSegments.join('')}" stroke-width="2" stroke="${cssHex(paletteBlack)}" /><path d="${leftInsetContainerSegments.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="${cssHex(paletteConsole)}" /></svg>`}
      />
      <vstack height='100%' grow>
        <hstack
          height='1px'
          width='100%'
          backgroundColor={cssHex(paletteBlack)}
        />
        <spacer grow />
        <hstack
          height='1px'
          width='100%'
          backgroundColor={cssHex(paletteBlack)}
        />
      </vstack>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height='100%'
        description='Background: Right Cap'
        url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${rightOuterBorderSegments.join('')}" stroke-width="2" stroke="${cssHex(paletteBlack)}" /></svg>`}
      />
    </hstack>
  )

  return (
    <zstack width='100%' alignment='center middle' onPress={props.onPress}>
      {background}

      <vstack width='100%' height='100%' alignment='center middle'>
        <PixelText {...props} size={12} color={cssHex(paletteWhite)}>
          {localize('point-claim-scoreboard-title')}
        </PixelText>

        {/* Team Scores */}
        <hstack width='100%' padding='small'>
          {props.scores.map(({team, score}, index) => (
            <>
              {index !== 0 && <spacer width='4px' />}
              <vstack
                key={`team-score-${team}`}
                grow
                height='48px'
                alignment='center middle'
                border='thick'
                borderColor={cssHex(paletteShade50)}
                backgroundColor={cssHex(teamColor[team])}
              >
                <PixelText {...props} size={22} color={cssHex(paletteBlack)}>
                  {abbreviateNumber(score)}
                </PixelText>
              </vstack>
            </>
          ))}
        </hstack>
      </vstack>
    </zstack>
  )
}
