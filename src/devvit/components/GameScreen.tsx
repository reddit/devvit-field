import {Devvit} from '@devvit/public-api'
import {type Team, teamColor, teams} from '../../shared/team'
import {
  cssHex,
  fontMSize,
  fontSSize,
  paletteBlack,
  paletteConsole,
  paletteDisabled,
  paletteFieldLight,
  paletteShade60,
} from '../../shared/theme'
import type {Level} from '../../shared/types/level'
import {PixelText} from './PixelText'
import {StyledButton} from './StyledButton'
import {Footer} from './game-screen/Footer'
import {Header} from './game-screen/Header'
import {InnerBorder} from './game-screen/InnerBorder'

const CAP_HEIGHT = 360
const CAP_WIDTH = 50
const RADIUS_LARGE = 15
const RADIUS_SMALL = 4

type GameScreenProps = {
  pixelRatio: number
  level: Level
  team: Team
}

export function GameScreen(props: GameScreenProps): JSX.Element {
  return (
    <zstack
      height='100%'
      width='100%'
      alignment='center middle'
      backgroundColor={cssHex(paletteConsole)}
    >
      {/* Main UI */}
      <vstack height='100%' width='100%' alignment='center'>
        <spacer size='xsmall' />
        <hstack width='100%' grow>
          <spacer size='xsmall' />
          <zstack height='100%' grow>
            {/* Header Background */}
            <hstack height='100%' width='100%'>
              <image
                imageWidth={CAP_WIDTH * props.pixelRatio}
                imageHeight={CAP_HEIGHT * props.pixelRatio}
                width={`${CAP_WIDTH}px`}
                height={`${CAP_HEIGHT}px`}
                description='Background: Left Cap'
                url={`data:image/svg+xml;charset=UTF-8,
<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="
M${CAP_WIDTH},0
v${CAP_HEIGHT}
h-${CAP_WIDTH - RADIUS_SMALL}
q-${RADIUS_SMALL},0 -${RADIUS_SMALL},-${RADIUS_SMALL}
v-${CAP_HEIGHT - RADIUS_SMALL - RADIUS_LARGE}
q0,-${RADIUS_LARGE} ${RADIUS_LARGE},-${RADIUS_LARGE}
z" fill="${cssHex(paletteBlack)}" />
</svg>`}
              />
              <hstack
                height={`${CAP_HEIGHT}px`}
                grow
                backgroundColor={cssHex(paletteBlack)}
              />
              <image
                imageWidth={CAP_WIDTH * props.pixelRatio}
                imageHeight={CAP_HEIGHT * props.pixelRatio}
                width={`${CAP_WIDTH}px`}
                height={`${CAP_HEIGHT}px`}
                description='Background: Right Cap'
                url={`data:image/svg+xml;charset=UTF-8,
<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="
M0,0
v${CAP_HEIGHT}
h${CAP_WIDTH - RADIUS_SMALL}
q${RADIUS_SMALL},0 ${RADIUS_SMALL},-${RADIUS_SMALL}
v-${CAP_HEIGHT - RADIUS_SMALL - RADIUS_LARGE}
q0,-${RADIUS_LARGE} -${RADIUS_LARGE},-${RADIUS_LARGE}
z" fill="${cssHex(paletteBlack)}" />
</svg>`}
              />
            </hstack>

            {/* Header Content */}
            <vstack height='100%' width='100%' alignment='center'>
              <Header {...props} />
              <Field {...props} />
            </vstack>
          </zstack>

          <spacer size='xsmall' />
        </hstack>

        <spacer size='xsmall' />
        <StyledButton {...props} color={cssHex(paletteDisabled)}>
          LOADING
        </StyledButton>
        <spacer size='xsmall' />
        <StatusBar {...props} />
        <spacer size='xsmall' />
        <Footer {...props} />
      </vstack>

      {/* Border */}
      <InnerBorder pixelRatio={props.pixelRatio} />
    </zstack>
  )
}

function Field(_props: GameScreenProps): JSX.Element {
  return <hstack width='100%' grow />
}

function StatusBar(props: GameScreenProps): JSX.Element {
  const REMAINING_TILES = 10000000
  const ACTIVE_PLAYERS = 0
  return (
    <hstack width='100%'>
      <spacer width='6px' />
      <vstack
        backgroundColor={cssHex(paletteShade60)}
        cornerRadius='small'
        grow
      >
        <spacer size='xsmall' />

        <hstack width='100%' alignment='center middle'>
          <spacer size='small' />
          <vstack grow>
            {teams.map((team, index) => (
              <>
                {index !== 0 && <spacer height='2px' />}
                <hstack
                  height='8px'
                  grow
                  key={`team-${team}`}
                  alignment='middle'
                >
                  <hstack width='25px' height='100%' alignment='end middle'>
                    <PixelText
                      {...props}
                      size={fontSSize}
                      color={cssHex(teamColor[team])}
                    >
                      000%
                    </PixelText>
                  </hstack>
                  <spacer size='small' />
                  <zstack height='100%' grow alignment='start middle'>
                    <hstack
                      height='100%'
                      width='100%'
                      backgroundColor={cssHex(teamColor[team])}
                    />
                  </zstack>
                </hstack>
              </>
            ))}
          </vstack>
          <spacer width='24px' />
          <vstack>
            <hstack alignment='middle'>
              <PixelText
                {...props}
                size={fontSSize}
                color={cssHex(paletteFieldLight)}
              >
                REMAINING TILES:
              </PixelText>
              <PixelText
                {...props}
                size={fontMSize}
                color={cssHex(paletteFieldLight)}
              >
                {` ${REMAINING_TILES.toLocaleString()}`}
              </PixelText>
            </hstack>

            <hstack alignment='middle'>
              <PixelText
                {...props}
                size={fontSSize}
                color={cssHex(paletteFieldLight)}
              >
                ACTIVE PLAYERS.:
              </PixelText>
              <PixelText
                {...props}
                size={fontMSize}
                color={cssHex(paletteFieldLight)}
              >
                {` ${ACTIVE_PLAYERS.toLocaleString()}`}
              </PixelText>
            </hstack>
          </vstack>
          <spacer size='small' />
        </hstack>
        <spacer size='xsmall' />
      </vstack>

      <spacer width='6px' />
    </hstack>
  )
}
