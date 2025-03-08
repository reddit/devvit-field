import {Devvit} from '@devvit/public-api'
import {localize} from '../../../shared/locale'
import {cssHex, paletteBlack, paletteWhite} from '../../../shared/theme'
import {PixelText} from '../PixelText'

type FooterProps = {
  pixelRatio: number
  onPress?: () => void
  radius?: number
  inset?: number
  backgroundColor?: `#${string}`
  textColor?: `#${string}`
}

export function Footer(props: FooterProps): JSX.Element {
  // Defaults
  const {
    pixelRatio,
    radius = 14,
    inset = 2,
    backgroundColor = cssHex(paletteBlack),
    textColor = cssHex(paletteWhite),
  } = props

  const HEIGHT = 30
  const WIDTH = 50

  return (
    <zstack width='100%' height={`${HEIGHT}px`} onPress={props.onPress}>
      {/* Background Layer */}
      <hstack height='100%' width='100%'>
        {/* Left Edge Segment */}
        <image
          imageWidth={WIDTH * pixelRatio}
          imageHeight={HEIGHT * pixelRatio}
          width={`${WIDTH}px`}
          height={`${HEIGHT}px`}
          description='Inset Border: Left Edge Segment'
          url={`data:image/svg+xml;charset=UTF-8,
<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="
M${inset},0
V${HEIGHT - radius - inset}
Q${inset},${HEIGHT - inset} ${inset + radius},${HEIGHT - inset}
H${WIDTH}
V0
Z" fill="${backgroundColor}" />
</svg>`}
        />

        {/* Stretchy Middle Segment */}
        <vstack height='100%' grow>
          <hstack width='100%' grow backgroundColor={backgroundColor} />
          <spacer height={`${inset}px`} />
        </vstack>

        {/* Right Edge Segment */}
        <image
          imageWidth={WIDTH * pixelRatio}
          imageHeight={HEIGHT * pixelRatio}
          width={`${WIDTH}px`}
          height={`${HEIGHT}px`}
          description='Inset Border: Right Edge Segment'
          url={`data:image/svg+xml;charset=UTF-8,
<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="
M0,0
H${WIDTH - inset}
V${HEIGHT - radius - inset}
Q${WIDTH - inset},${HEIGHT - inset} ${WIDTH - radius - inset},${HEIGHT - inset}
H0
Z" fill="${backgroundColor}" />
</svg>`}
        />
      </hstack>

      {/* Content Layer */}
      <vstack height='100%' width='100%' alignment='center middle'>
        <PixelText {...props} size={12} color={textColor}>
          {localize('game-footer-attribution')}
        </PixelText>
      </vstack>
    </zstack>
  )
}
