import {Devvit, useState} from '@devvit/public-api'
import {localize} from '../../shared/locale'
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

  return (
    <zstack height='100%' width='100%' backgroundColor={cssHex(paletteConsole)}>
      <InnerBorder {...props} />

      <vstack height='100%' width='100%' padding='xsmall'>
        <vstack width='100%' grow alignment='center middle' padding='small'>
          <Header {...props} scores={props.standings} />

          <spacer height='8px' />

          {/* FIELD */}
          <zstack
            width='100%'
            grow
            backgroundColor={cssHex(paletteBlack)}
            padding='small'
            alignment='center middle'
          >
            <image
              imageHeight={184}
              imageWidth={184}
              width='184px'
              height='184px'
              description='Ban Box Shadow'
              resizeMode='fill'
              url='final-cell-glow.png'
            />
            {claimed && (
              <image
                imageHeight={240}
                imageWidth={240}
                width='120px'
                height='120px'
                description='Ban Box Animation'
                resizeMode='fill'
                url='logo-grow.gif'
              />
            )}
            <hstack
              width='120px'
              height='120px'
              border='thick'
              borderColor={cssHex(paletteFieldLight)}
            />
          </zstack>

          <spacer height='8px' />

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
        </vstack>

        <Footer {...props} scores={props.standings} claimed={claimed} />
      </vstack>

      {claimed && (
        <vstack height='100%' width='100%'>
          <hstack width='100%' grow alignment='center bottom'>
            <spacer width='28px' />
            <hstack
              grow
              height='100%'
              maxWidth='432px'
              alignment='center bottom'
            >
              <spacer width={`${props.team * 25}%`} />
              <image
                imageHeight={512}
                imageWidth={256}
                width='25%'
                height='128px'
                description='Point earned'
                resizeMode='fit'
                url='earned-a-point.gif'
              />
              <spacer width={`${100 - (props.team + 1) * 25}%`} />
            </hstack>
            <spacer width='28px' />
          </hstack>
          <spacer height='90px' />
        </vstack>
      )}
    </zstack>
  )
}
