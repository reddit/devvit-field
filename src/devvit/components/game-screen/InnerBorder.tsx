import {Devvit} from '@devvit/public-api'
import {cssHex, paletteBlack} from '../../../shared/theme'

type InnerBorderProps = {
  pixelRatio: number
  height?: number
  width?: number
  radius?: number
  inset?: number
  borderColor?: string
  borderWidth?: number
}

export function InnerBorder(props: InnerBorderProps): JSX.Element {
  // Defaults
  const {
    pixelRatio,
    height = 512,
    width = 50,
    radius = 14,
    inset = 2,
    borderColor = cssHex(paletteBlack),
    borderWidth = 2,
  } = props

  return (
    <hstack height='100%' width='100%'>
      {/* Left Edge Segment */}
      <image
        imageWidth={width * pixelRatio}
        imageHeight={height * pixelRatio}
        width={`${width}px`}
        height={`${height}px`}
        description='Inset Border: Left Edge Segment'
        url={`data:image/svg+xml;charset=UTF-8,
<svg viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="
M${width},${inset}
h-${width - radius - inset}
q-${radius},0 -${radius},${radius}
v${height - radius - radius - inset * 2}
q0,${radius} ${radius},${radius}
h${width - radius - inset}
" fill="none" strokeWidth="${borderWidth}" stroke="${borderColor}" />
</svg>`}
      />

      {/* Stretchy Middle Segment */}
      <vstack height={`${height}px`} grow>
        <spacer height={`${inset - borderWidth / 4}px`} />
        <hstack
          width='100%'
          height={`${borderWidth / 2}px`}
          backgroundColor={borderColor}
        />
        <spacer grow />
        <hstack
          width='100%'
          height={`${borderWidth / 2}px`}
          backgroundColor={borderColor}
        />
        <spacer height={`${inset - borderWidth / 4}px`} />
      </vstack>

      {/* Right Edge Segment */}
      <image
        imageWidth={width * pixelRatio}
        imageHeight={height * pixelRatio}
        width={`${width}px`}
        height={`${height}px`}
        description='Inset Border: Right Edge Segment'
        url={`data:image/svg+xml;charset=UTF-8,
<svg viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="
M0,${inset}
h${width - radius - inset}
q${radius},0 ${radius},${radius}
v${height - radius - radius - inset * 2}
q0,${radius} -${radius},${radius}
h-${width - radius - inset}
" fill="none" strokeWidth="${borderWidth}" stroke="${borderColor}" />
</svg>`}
      />
    </hstack>
  )
}
