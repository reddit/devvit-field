import {Devvit, svg} from '@devvit/public-api'
import {
  cssHex,
  paletteBlack,
  paletteConsole,
  paletteShade19,
} from '../../../shared/theme'

type RaisedPanelProps = {
  pixelRatio: number
  active?: boolean
}

export function RaisedPanel(props: RaisedPanelProps): JSX.Element {
  const CAP_HEIGHT = 44
  const CAP_WIDTH = 20
  const RADIUS_OUTER = 4
  const RADIUS_INNER = 3

  const borderColor = cssHex(paletteBlack)

  return (
    <hstack height={`${CAP_HEIGHT}px`} grow>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height='100%'
        description='Background: Left Cap'
        url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        <!-- Shadow -->
        <path d="M${CAP_WIDTH},0H${RADIUS_OUTER}Q0,0 0,${RADIUS_OUTER}V${CAP_HEIGHT - RADIUS_OUTER}Q0,${CAP_HEIGHT} ${RADIUS_OUTER},${CAP_HEIGHT}H${CAP_WIDTH}" fill="${cssHex(paletteShade19)}" />
        
        <!-- Side: Border -->
        <path d="M${CAP_WIDTH},0H${RADIUS_OUTER}Q0,0 0,${RADIUS_OUTER}V${40 - RADIUS_OUTER}Q0,40 ${RADIUS_OUTER},40 H${CAP_WIDTH}" fill="${borderColor}" />

        <!-- Side: Fill -->
        <path d="M${CAP_WIDTH},1H1V${39 - RADIUS_INNER}Q1,39 ${1 + RADIUS_INNER},39H${CAP_WIDTH}" fill="${cssHex(paletteConsole)}" />

        <!-- Top: Border -->
        <path d="M${CAP_WIDTH},0H${RADIUS_OUTER}Q0,0 0,${RADIUS_OUTER}V${32 - RADIUS_OUTER}Q0,32 ${RADIUS_OUTER},32H${CAP_WIDTH}" fill="${borderColor}" />

        <!-- Top: Fill -->
        <path d="M${CAP_WIDTH},1H${1 + RADIUS_INNER}Q1,1 1,${RADIUS_INNER}V${31 - RADIUS_INNER}Q1,31 ${RADIUS_INNER + 1},31H${CAP_WIDTH}" fill="${cssHex(paletteConsole)}" />

        <!-- Inset: Border -->
        <path d="M${CAP_WIDTH},4H${RADIUS_OUTER + 4}Q4,4 4,${RADIUS_OUTER + 4}V${28 - RADIUS_OUTER}Q4,28 ${4 + RADIUS_OUTER},28H${CAP_WIDTH}" fill="${borderColor}" />

        <!-- Inset: Fill -->
        <path d="M${CAP_WIDTH},5H${5 + RADIUS_INNER}Q5,5 5,${5 + RADIUS_INNER}V${27 - RADIUS_INNER}Q5,27 ${5 + RADIUS_INNER},27H${CAP_WIDTH}" fill="#021007" /></svg>`}
      />

      <zstack grow height='100%' alignment='center middle'>
        <vstack height='100%' width='100%'>
          <hstack height='1px' width='100%' backgroundColor={borderColor} />

          <hstack
            height='3px'
            width='100%'
            backgroundColor={cssHex(paletteConsole)}
          />

          <hstack height='1px' width='100%' backgroundColor={borderColor} />

          <hstack height='22px' width='100%' backgroundColor='#021007' />

          <hstack height='1px' width='100%' backgroundColor={borderColor} />

          <hstack
            height='3px'
            width='100%'
            backgroundColor={cssHex(paletteConsole)}
          />

          <hstack height='1px' width='100%' backgroundColor={borderColor} />

          <hstack
            height='7px'
            width='100%'
            backgroundColor={cssHex(paletteConsole)}
          />

          <hstack height='1px' width='100%' backgroundColor={borderColor} />

          <hstack
            height='4px'
            width='100%'
            backgroundColor={cssHex(paletteShade19)}
          />
        </vstack>
        {props.active ? (
          <vstack height='100%' width='100%' alignment='center top'>
            <spacer height='6px' />
            <image
              imageHeight={48}
              imageWidth={48}
              width='20px'
              height='20px'
              description='Ban Box Animation'
              resizeMode='fit'
              url='logo-flicker.gif'
            />
          </vstack>
        ) : null}
      </zstack>

      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height='100%'
        description='Background: Right Cap'
        url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        <!-- Shadow -->
        <path d="M0,0H${CAP_WIDTH - RADIUS_OUTER}Q${CAP_WIDTH},0 ${CAP_WIDTH},${RADIUS_OUTER}V${CAP_HEIGHT - RADIUS_OUTER}Q${CAP_WIDTH},${CAP_HEIGHT} ${CAP_WIDTH - RADIUS_OUTER},${CAP_HEIGHT}H0" fill="${cssHex(paletteShade19)}" />
        
        <!-- Side: Border -->
        <path d="M0,0H${CAP_WIDTH - RADIUS_OUTER}Q${CAP_WIDTH},0 ${CAP_WIDTH},${RADIUS_OUTER}V${40 - RADIUS_OUTER}Q${CAP_WIDTH},40 ${CAP_WIDTH - RADIUS_OUTER},40 H0" fill="${borderColor}" />

        <!-- Side: Fill -->
        <path d="M0,1H${CAP_WIDTH - 1}V${39 - RADIUS_INNER}Q${CAP_WIDTH - 1},39 ${CAP_WIDTH - 1 - RADIUS_INNER},39H0" fill="${cssHex(paletteConsole)}" />

        <!-- Top: Border -->
        <path d="M0,0H${CAP_WIDTH - RADIUS_OUTER}Q${CAP_WIDTH},0 ${CAP_WIDTH},${RADIUS_OUTER}V${32 - RADIUS_OUTER}Q${CAP_WIDTH},32 ${CAP_WIDTH - RADIUS_OUTER},32H0" fill="${borderColor}" />

        <!-- Top: Fill -->
        <path d="M0,1H${CAP_WIDTH - 1 - RADIUS_INNER}Q${CAP_WIDTH - 1},1 ${CAP_WIDTH - 1},${RADIUS_INNER}V${31 - RADIUS_INNER}Q${CAP_WIDTH - 1},31 ${CAP_WIDTH - 1 - RADIUS_INNER},31H0" fill="${cssHex(paletteConsole)}" />

        <!-- Inset: Border -->
        <path d="M0,4H${CAP_WIDTH - RADIUS_OUTER - 4}Q${CAP_WIDTH - 4},4 ${CAP_WIDTH - 4},${RADIUS_OUTER + 4}V${28 - RADIUS_OUTER}Q${CAP_WIDTH - 4},28 ${CAP_WIDTH - RADIUS_OUTER - 4},28H0" fill="${borderColor}" />

        <!-- Inset: Fill -->
        <path d="M0,5H${CAP_WIDTH - 5 - RADIUS_INNER}Q${CAP_WIDTH - 5},5 ${CAP_WIDTH - 5},${5 + RADIUS_INNER}V${27 - RADIUS_INNER}Q${CAP_WIDTH - 5},27 ${CAP_WIDTH - 5 - RADIUS_INNER},27H0" fill="#021007" /></svg>`}
      />
    </hstack>
  )
}
