import {type Context, Devvit, svg} from '@devvit/public-api'
import {abbreviateNumber} from '../../../shared/format'
import {localize} from '../../../shared/locale'
import {createFooterEnd} from '../../../shared/svg-factories/createFooterEnd'
import {createFooterMiddle} from '../../../shared/svg-factories/createFooterMiddle'
import {createFooterStart} from '../../../shared/svg-factories/createFooterStart'
import {
  CAP_HEIGHT,
  CAP_WIDTH,
  MIDDLE_WIDTH,
  TITLE_NOTCH_HEIGHT,
} from '../../../shared/svg-factories/footerSettings'
import {type Team, teamColor} from '../../../shared/team'
import {
  cssHex,
  paletteBlack,
  paletteShade50,
  paletteWhite,
} from '../../../shared/theme'
import {config2} from '../../../shared/types/level'
import {PixelText} from '../PixelText'

type FooterProps = {
  pixelRatio: number
  claimed?: boolean
  onPress?: () => void
  scores: {member: Team; score: number}[]
}

export function Footer(props: FooterProps, context: Context): JSX.Element {
  const background = (
    <hstack height={`${CAP_HEIGHT}px`} width='100%'>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height={`${CAP_HEIGHT}px`}
        url={svg`${createFooterStart()}`}
      />
      <zstack grow height='100%' alignment='center middle'>
        <image
          imageWidth={MIDDLE_WIDTH * props.pixelRatio}
          imageHeight={CAP_HEIGHT * props.pixelRatio}
          width={`${MIDDLE_WIDTH}px`}
          height={`${CAP_HEIGHT}px`}
          url={svg`${createFooterMiddle()}`}
        />
      </zstack>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height={`${CAP_HEIGHT}px`}
        url={svg`${createFooterEnd()}`}
      />
    </hstack>
  )

  return (
    <zstack
      width='100%'
      height={`${CAP_HEIGHT}px`}
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
            {props.scores.map(({member, score}) => (
              <hstack key={`team-score-${member}`} height='100%' width='25%'>
                <spacer width='2px' />
                <vstack
                  grow
                  height='100%'
                  alignment='center middle'
                  border='thick'
                  borderColor={cssHex(paletteShade50)}
                  backgroundColor={cssHex(teamColor[member])}
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
          onPress={() => context.ui.navigateTo(config2.leaderboard.url)}
        />
      </vstack>
    </zstack>
  )
}
