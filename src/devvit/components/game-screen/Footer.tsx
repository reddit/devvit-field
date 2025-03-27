import {type Context, Devvit, svg} from '@devvit/public-api'
import {abbreviateNumber} from '../../../shared/format'
import {localize} from '../../../shared/locale'
import {createFooterEnd} from '../../../shared/svg-factories/createFooterEnd'
import {createFooterMiddle} from '../../../shared/svg-factories/createFooterMiddle'
import {createFooterStart} from '../../../shared/svg-factories/createFooterStart'
import {createPersonIcon} from '../../../shared/svg-factories/createPersonIcon'
import {
  CAP_HEIGHT,
  CAP_WIDTH,
  MIDDLE_WIDTH,
  TITLE_NOTCH_HEIGHT,
} from '../../../shared/svg-factories/footerSettings'
import {type Team, teamColor} from '../../../shared/team'
import {
  cssHex,
  fontMSize,
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
  team: Team
}

export function Footer(props: FooterProps, context: Context): JSX.Element {
  const teamHeight = 28
  const teamHeightString = `${teamHeight}px`
  const teamGap = 12

  const background = (
    <hstack height='100%' width='100%'>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height={`${CAP_HEIGHT}px`}
        resizeMode='fill'
        url={svg`${createFooterStart()}`}
      />
      <zstack grow height='100%' alignment='center middle'>
        <image
          imageWidth={MIDDLE_WIDTH * props.pixelRatio}
          imageHeight={CAP_HEIGHT * props.pixelRatio}
          width={`${MIDDLE_WIDTH}px`}
          height={`${CAP_HEIGHT}px`}
          resizeMode='fill'
          url={svg`${createFooterMiddle()}`}
        />
      </zstack>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height={`${CAP_HEIGHT}px`}
        resizeMode='fill'
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

        <spacer height='6px' />

        {/* Team Scores */}
        <hstack
          width='100%'
          height={teamHeightString}
          alignment='center middle'
        >
          <spacer width='24px' />
          <hstack grow maxWidth={`${420 + teamGap}px`}>
            {props.scores.map(({member, score}) => (
              <hstack key={`team-score-${member}`} width='25%'>
                <spacer width={`${teamGap / 2}px`} />
                <vstack
                  grow
                  height={teamHeightString}
                  border='thick'
                  borderColor={cssHex(paletteShade50)}
                  backgroundColor={cssHex(teamColor[member])}
                >
                  <hstack
                    width='100%'
                    height='100%'
                    alignment='center middle'
                    border='thick'
                    borderColor={cssHex(paletteShade50)}
                  >
                    {props.team === member && (
                      <hstack
                        height='100%'
                        alignment='center middle'
                        backgroundColor={cssHex(paletteShade50)}
                      >
                        <spacer width='4px' />
                        <image
                          imageHeight={12 * props.pixelRatio}
                          imageWidth={12 * props.pixelRatio}
                          width='12px'
                          height='12px'
                          url={svg`${createPersonIcon(props.team)}`}
                        />
                        <spacer width='8px' />
                      </hstack>
                    )}
                    <spacer grow />
                    <PixelText
                      {...props}
                      size={fontMSize}
                      color={cssHex(paletteBlack)}
                    >
                      {abbreviateNumber(score)}
                    </PixelText>
                    <spacer grow />
                  </hstack>
                </vstack>
                <spacer width={`${teamGap / 2}px`} />
              </hstack>
            ))}
          </hstack>
          <spacer width='24px' />
        </hstack>

        <spacer height='6px' />

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
