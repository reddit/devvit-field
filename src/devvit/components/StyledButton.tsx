import {Devvit} from '@devvit/public-api'

import {
  cssHex,
  paletteBlack,
  paletteFieldLight,
  paletteWhite,
} from '../../shared/theme.js'
import {PixelText} from './PixelText.js'

type StyledButtonProps = {
  children: string
  color?: `#${string}`
  width?: number
  pixelRatio: number
  onPress?: (() => void) | undefined
}

export function StyledButton(props: StyledButtonProps): JSX.Element {
  const color = props.color ?? cssHex(paletteFieldLight)
  const height = 44
  const width = props.width ?? 256

  const RADIUS = 8

  return (
    <zstack width={`${width}px`} height={`${height}px`} onPress={props.onPress}>
      <image
        imageHeight={Math.ceil(height * props.pixelRatio)}
        imageWidth={Math.ceil(width * props.pixelRatio)}
        width='100%'
        height='100%'
        resizeMode='fit'
        description={`"${props.children}" button`}
        url={`data:image/svg+xml;charset=UTF-8,
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  
  <!-- Button Shadow -->
  <rect x="0" y="10" width="${width}" height="34" rx="${RADIUS}" ry="${RADIUS}" fill="${cssHex(
    paletteBlack,
  )}" opacity="0.5" />
  
  <!-- Button Side: Stroke -->
  <rect x="0" y="6" width="${width}" height="34" rx="${RADIUS}" ry="${RADIUS}" fill="${cssHex(
    paletteBlack,
  )}" />

  <!-- Button Side: Fill -->
  <rect x="1" y="7" width="${width - 2}" height="32" rx="${RADIUS - 1}" ry="${
    RADIUS - 1
  }" fill="${color}" />

  <!-- Button Side: Tint -->
  <rect x="1" y="7" width="${width - 2}" height="32" rx="${RADIUS - 1}" ry="${
    RADIUS - 1
  }" fill="${cssHex(paletteBlack)}" opacity="0.5" />
  
  <!-- Front: Stroke -->
  <rect x="0" y="0" width="${width}" height="34" rx="${RADIUS}" ry="${RADIUS}" fill="${cssHex(
    paletteBlack,
  )}" />

  <!-- Front: Fill -->
  <rect x="1" y="1" width="${width - 2}" height="32" rx="${RADIUS - 1}" ry="${
    RADIUS - 1
  }" fill="${color}" />

  <!-- Front: Highlight -->
  <rect x="8" y="2" width="${
    width - 16
  }" height="3" rx="1.5" ry="1.5" fill="${cssHex(
    paletteWhite,
  )}" opacity="0.6" />
  </svg>`}
      />
      <vstack height='100%' width='100%' alignment='top center'>
        <spacer height='6px' />
        <PixelText
          {...props}
          size={17}
          color={cssHex(paletteBlack)}
          opacity={0.6}
        >
          {props.children}
        </PixelText>
      </vstack>
    </zstack>
  )
}
