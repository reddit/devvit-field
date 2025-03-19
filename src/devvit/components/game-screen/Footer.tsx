import {type Context, Devvit, svg} from '@devvit/public-api'
import {abbreviateNumber} from '../../../shared/format'
import {localize} from '../../../shared/locale'
import {type Team, teamColor} from '../../../shared/team'
import {
  cssHex,
  paletteBlack,
  paletteConsole,
  paletteShade19,
  paletteShade50,
  paletteShade80,
  paletteTint19,
  paletteWhite,
} from '../../../shared/theme'
import {PixelText} from '../PixelText'

const CAP_HEIGHT = 128
const CAP_WIDTH = 48
const MIDDLE_WIDTH = 1048
const RADIUS = 8
const STROKE_WEIGHT = 1
const TITLE_NOTCH_WIDTH = 128
const TITLE_NOTCH_HEIGHT = 16
const HALF_STROKE = STROKE_WEIGHT / 2

type FooterProps = {
  pixelRatio: number
  claimed?: boolean
  onPress?: () => void
  scores: {team: Team; score: number}[]
}

export function Footer(props: FooterProps, context: Context): JSX.Element {
  const background = (
    <hstack height={`${CAP_HEIGHT}px`} width='100%'>
      <LeftCap {...props} />
      <Middle {...props} />
      <RightCap {...props} />
    </hstack>
  )

  return (
    <zstack
      width='100%'
      height='128px'
      alignment='center middle'
      onPress={props.onPress}
    >
      {background}

      {/* Content */}
      <vstack width='100%' height='100%' alignment='center top'>
        <spacer width='8px' />

        {/* Notch Label */}
        <vstack
          height={`${TITLE_NOTCH_HEIGHT}px`}
          width='100%'
          alignment='center middle'
        >
          <PixelText {...props} size={12} color={cssHex(paletteWhite)}>
            {localize('point-claim-scoreboard-title')}
          </PixelText>
        </vstack>

        {/* Team Scores */}
        <hstack width='100%' grow padding='small'>
          <spacer width='14px' />
          <hstack height='100%' grow>
            {props.scores.map(({team, score}) => (
              <hstack key={`team-score-${team}`} height='100%' width='25%'>
                <spacer width='2px' />
                <vstack
                  grow
                  height='100%'
                  alignment='center middle'
                  border='thick'
                  borderColor={cssHex(paletteShade50)}
                  backgroundColor={cssHex(teamColor[team])}
                >
                  <PixelText {...props} size={22} color={cssHex(paletteBlack)}>
                    {abbreviateNumber(score)}
                  </PixelText>
                </vstack>
                <spacer width='2px' />
              </hstack>
            ))}
          </hstack>
          <spacer width='14px' />
        </hstack>

        <spacer height='4px' />

        {/* GOR Button */}
        <image
          imageWidth={128 * props.pixelRatio}
          imageHeight={29 * props.pixelRatio}
          width={`${128}px`}
          height={`${29}px`}
          description='r/GamesOnReddit Button'
          url={`gor-button-${props.claimed ? 'enabled' : 'disabled'}.png`}
          onPress={() =>
            context.ui.navigateTo('https://www.reddit.com/r/GamesOnReddit/')
          }
        />

        <spacer height='14px' />
      </vstack>
    </zstack>
  )
}

type CapProps = {
  pixelRatio: number
}

/*
 * Background: Left Cap
 */

function LeftCap(props: CapProps): JSX.Element {
  const shadow = [
    `M${CAP_WIDTH},8`,
    `H${8 + RADIUS}`,
    `Q8,8 8,${8 + RADIUS}`,
    `V${104 - RADIUS}`,
    `Q8,${104} ${8 + RADIUS},${104}`,
    `H${CAP_WIDTH}`,
  ]
  const bottomTint = [
    `M${CAP_WIDTH},16`,
    `H${16 + RADIUS}`,
    `Q16,16 16,${16 + RADIUS}`,
    `V${120 - RADIUS}`,
    `Q16,${120} ${16 + RADIUS},${120}`,
    `H${CAP_WIDTH}`,
  ]

  const outerBorder = [
    `M${CAP_WIDTH},${HALF_STROKE}`,
    `H${HALF_STROKE}`,
    `V${CAP_HEIGHT - HALF_STROKE - RADIUS * 2}`,
    `Q${HALF_STROKE},${CAP_HEIGHT - HALF_STROKE} ${RADIUS * 2},${CAP_HEIGHT - HALF_STROKE}`,
    `H${CAP_WIDTH}`,
  ]

  const insetContainer = [
    `M${CAP_WIDTH},8`,
    `H${8 + RADIUS}`,
    `Q8,8 8,${8 + RADIUS}`,
    `V${96 - RADIUS}`,
    `Q8,${96} ${8 + RADIUS},${96}`,
    `H${CAP_WIDTH}`,
  ]

  return (
    <image
      imageWidth={CAP_WIDTH * props.pixelRatio}
      imageHeight={CAP_HEIGHT * props.pixelRatio}
      width={`${CAP_WIDTH}px`}
      height={`${CAP_HEIGHT}px`}
      url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${shadow.join('')}" fill="${cssHex(paletteShade19)}" /><path d="${bottomTint.join('')}" fill="${cssHex(paletteBlack)}" /><path d="${outerBorder.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="none" /><path d="${insetContainer.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="${cssHex(paletteConsole)}" /></svg>`}
    />
  )
}

/*
 * Background: Middle Section
 */

function Middle(props: CapProps): JSX.Element {
  const mid = MIDDLE_WIDTH / 2

  const bottomTint = ['M0,96', `H${MIDDLE_WIDTH}`, 'V120', 'H0']

  const outerBorder = [
    `M0,${HALF_STROKE}`,
    `H${MIDDLE_WIDTH}`,
    `M0,${CAP_HEIGHT - HALF_STROKE}`,
    `H${MIDDLE_WIDTH}`,
  ]

  const insetContainer = [
    `M${CAP_WIDTH},8`,
    `H${MIDDLE_WIDTH}`,
    `M${CAP_WIDTH},96`,
    `H${MIDDLE_WIDTH}`,
  ]

  const wingsDark = [
    'M0,16',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    'M0,21',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},16`,
    `H${MIDDLE_WIDTH}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},21`,
    `H${MIDDLE_WIDTH}`,
  ]

  const wingsLight = [
    'M0,17',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    'M0,22',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},17`,
    `H${MIDDLE_WIDTH}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},22`,
    `H${MIDDLE_WIDTH}`,
  ]
  const titleNotch = [
    `M${mid - TITLE_NOTCH_WIDTH / 2},${HALF_STROKE + 8}`,
    `L${mid - TITLE_NOTCH_WIDTH / 2 + TITLE_NOTCH_HEIGHT},${HALF_STROKE + 8 + TITLE_NOTCH_HEIGHT}`,
    `H${mid + TITLE_NOTCH_WIDTH / 2 - TITLE_NOTCH_HEIGHT}`,
    `L${mid + TITLE_NOTCH_WIDTH / 2},${HALF_STROKE + 8}`,
  ]

  const logoNotch = [
    `M${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS},${96}`,
    `Q${mid - TITLE_NOTCH_WIDTH / 2},${96} ${mid - TITLE_NOTCH_WIDTH / 2},${96 - RADIUS}`,
    `Q${mid - TITLE_NOTCH_WIDTH / 2},${96 - 16} ${mid - TITLE_NOTCH_WIDTH / 2 + RADIUS},${96 - 16}`,
    `H${mid + TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    `Q${mid + TITLE_NOTCH_WIDTH / 2},${96 - 16} ${mid + TITLE_NOTCH_WIDTH / 2},${96 - RADIUS}`,
    `Q${mid + TITLE_NOTCH_WIDTH / 2},${96} ${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},${96}`,
    'Z',
  ]

  // <path d="M0 16V0H70V16H55C52.7909 16 51 14.2091 51 12C51 9.79086 49.2091 8 47 8H27C24.7909 8 23 9.79086 23 12C23 14.2091 21.2091 16 19 16H0Z" fill="black"/>

  return (
    <zstack height={`${CAP_HEIGHT}px`} grow alignment='center middle'>
      <image
        imageWidth={MIDDLE_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${MIDDLE_WIDTH}px`}
        height={`${CAP_HEIGHT}px`}
        url={svg`<svg viewBox="0 0 ${MIDDLE_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${titleNotch.join('')}${bottomTint.join('')}${logoNotch.join('')}" fill="${cssHex(paletteBlack)}" /><path d="${outerBorder.join('')}${insetContainer.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="none" /><path d="${wingsDark.join('')}" stroke-width="1" stroke="${cssHex(paletteShade80)}" fill="none" /><path d="${wingsLight.join('')}" stroke-width="1" stroke="${cssHex(paletteTint19)}" fill="none" /></svg>`}
      />
    </zstack>
  )
}

/*
 * Background: Right Cap
 */

function RightCap(props: CapProps): JSX.Element {
  const rightShadowSegments = [
    'M0,8',
    `H${CAP_WIDTH - RADIUS - 8}`,
    `Q${CAP_WIDTH - 8},8 ${CAP_WIDTH - 8},${8 + RADIUS}`,
    `V${104 - RADIUS}`,
    `Q${CAP_WIDTH - 8},${104} ${CAP_WIDTH - RADIUS - 8},${104}`,
    'H0',
  ]
  const rightTintSegments = [
    'M0,16',
    `H${CAP_WIDTH - RADIUS - 16}`,
    `Q${CAP_WIDTH - 16},16 ${CAP_WIDTH - 16},${16 + RADIUS}`,
    `V${120 - RADIUS}`,
    `Q${CAP_WIDTH - 16},${120} ${CAP_WIDTH - RADIUS - 16},${120}`,
    'H0',
  ]

  const rightOuterBorderSegments = [
    `M0,${HALF_STROKE}`,
    `H${CAP_WIDTH - HALF_STROKE}`,
    `V${CAP_HEIGHT - HALF_STROKE - RADIUS * 2}`,
    `Q${CAP_WIDTH - HALF_STROKE},${CAP_HEIGHT - HALF_STROKE} ${CAP_WIDTH - RADIUS * 2},${CAP_HEIGHT - HALF_STROKE}`,
    'H0',
  ]

  const rightInsetContainerSegments = [
    'M0,8',
    `H${CAP_WIDTH - RADIUS - 8}`,
    `Q${CAP_WIDTH - 8},8 ${CAP_WIDTH - 8},${8 + RADIUS}`,
    `V${96 - RADIUS}`,
    `Q${CAP_WIDTH - 8},${96} ${CAP_WIDTH - RADIUS - 8},${96}`,
    'H0',
  ]

  return (
    <image
      imageWidth={CAP_WIDTH * props.pixelRatio}
      imageHeight={CAP_HEIGHT * props.pixelRatio}
      width={`${CAP_WIDTH}px`}
      height={`${CAP_HEIGHT}px`}
      url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${rightShadowSegments.join('')}" fill="${cssHex(paletteShade19)}" /><path d="${rightTintSegments.join('')}" fill="${cssHex(paletteBlack)}" /><path d="${rightOuterBorderSegments.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="none" /><path d="${rightInsetContainerSegments.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="${cssHex(paletteConsole)}" /></svg>`}
    />
  )
}
