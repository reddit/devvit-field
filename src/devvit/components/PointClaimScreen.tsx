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
import {StyledButton} from './StyledButton'
import {Footer} from './game-screen/Footer'
import {Header} from './game-screen/Header'
import {InnerBorder} from './game-screen/InnerBorder'
import {RaisedPanel} from './game-screen/RaisedPanel'

type PointClaimScreenProps = {
  pixelRatio: number
  team: Team
  standings: {member: Team; score: number}[]
  onClaimPress: () => void | Promise<void>
}

export function PointClaimScreen(props: PointClaimScreenProps): JSX.Element {
  const [claimed, setClaimed] = useState(false)
  const symbolHeight = 120

  return (
    <zstack height='100%' width='100%' backgroundColor={cssHex(paletteConsole)}>
      <InnerBorder {...props} />

      <vstack height='100%' width='100%' padding='xsmall'>
        <vstack width='100%' grow alignment='center middle' padding='small'>
          <Header {...props} scores={props.standings} />

          <spacer height='8px' />

          {/* FIELD */}
          <vstack
            width='100%'
            grow
            backgroundColor={cssHex(paletteBlack)}
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
              onPress={async () => {
                await props.onClaimPress()
                setClaimed(true)
              }}
            >
              {claimed
                ? localize('point-claim-button-label-after')
                : localize('point-claim-button-label')}
            </StyledButton>
            <spacer width='12px' />
            <RaisedPanel {...props} active={claimed} />
          </hstack>

          <spacer size='small' />
        </vstack>

        <Footer {...props} scores={props.standings} claimed={claimed} />
      </vstack>
    </zstack>
  )
}
