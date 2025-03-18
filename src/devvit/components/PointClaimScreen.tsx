import {Devvit, svg, useState} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {createBanBoxBadge} from '../../shared/svg-factories/createBanBoxBadge'
import {type Team, teamColor} from '../../shared/team'
import {
  cssHex,
  paletteBlack,
  paletteConsole,
  paletteDisabled,
  paletteFieldLight,
} from '../../shared/theme'
import {type Level, levelHighlightColor} from '../../shared/types/level'
import {StyledButton} from './StyledButton'
import {Footer} from './game-screen/Footer'
import {Header} from './game-screen/Header'
import {InnerBorder} from './game-screen/InnerBorder'
import {RaisedPanel} from './game-screen/RaisedPanel'

type PointClaimScreenProps = {
  pixelRatio: number
  level: Level
  team: Team
}

export function PointClaimScreen(props: PointClaimScreenProps): JSX.Element {
  const [claimed, setClaimed] = useState(false)
  // to-do: replace with actual scores
  const scores: {team: Team; score: number}[] = [
    {team: 0, score: 8},
    {team: 1, score: 13},
    {team: 2, score: 21},
    {team: 3, score: 34},
  ]
  const symbolHeight = 120

  return (
    <zstack height='100%' width='100%' backgroundColor={cssHex(paletteConsole)}>
      <InnerBorder {...props} />
      <vstack
        height='100%'
        width='100%'
        alignment='center middle'
        padding='small'
      >
        <Header {...props} scores={scores} />

        <spacer size='xsmall' />

        {/* FIELD */}
        <vstack
          width='100%'
          grow
          backgroundColor={cssHex(paletteBlack)}
          border='thin'
          borderColor={cssHex(levelHighlightColor[props.level])}
          padding='small'
          alignment='center middle'
        >
          <zstack width='184px' height='184px' alignment='center middle'>
            <image
              imageHeight={184}
              imageWidth={184}
              width='184px'
              height='184px'
              description='Ban Box Shadow'
              resizeMode='fill'
              url='final-cell-glow.png'
            />
            <hstack
              width='120px'
              height='120px'
              border='thick'
              borderColor={cssHex(paletteFieldLight)}
            />
            {claimed && (
              <image
                imageHeight={Math.ceil(symbolHeight * props.pixelRatio)}
                imageWidth={Math.ceil(symbolHeight * props.pixelRatio)}
                width='120px'
                height='120px'
                description='Ban Box Illustration'
                resizeMode='fill'
                url={svg`${createBanBoxBadge()}`}
              />
            )}
          </zstack>
        </vstack>

        <spacer size='medium' />

        <hstack width='100%' alignment='center middle'>
          <RaisedPanel {...props} active={claimed} />
          <spacer width='12px' />
          <StyledButton
            {...props}
            color={cssHex(claimed ? paletteDisabled : teamColor[props.team])}
            onPress={() => setClaimed(!claimed)}
          >
            {claimed
              ? localize('point-claim-button-label-after')
              : localize('point-claim-button-label')}
          </StyledButton>
          <spacer width='12px' />
          <RaisedPanel {...props} active={claimed} />
        </hstack>

        <spacer size='small' />

        <Footer {...props} scores={scores} />
      </vstack>
    </zstack>
  )
}
