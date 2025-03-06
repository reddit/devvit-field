import {Devvit} from '@devvit/public-api'

import {
  cssHex,
  fallbackPixelRatio,
  paletteBlack,
  paletteTerminalGreen,
  paletteWhite,
} from '../../shared/theme.js'
import {PixelText} from './PixelText.js'

type StyledButtonProps = {
  children: string
  color?: `#${string}`
  width?: number
  pixelRatio?: number
  onPress?: (() => void) | undefined
}

export function StyledButton(props: StyledButtonProps): JSX.Element {
  const color = props.color ?? cssHex(paletteTerminalGreen)
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio
  const height = 44
  const width = props.width ?? 256

  return (
    <zstack width={`${width}px`} height={`${height}px`} onPress={props.onPress}>
      <image
        imageHeight={Math.ceil(height * pixelRatio)}
        imageWidth={Math.ceil(width * pixelRatio)}
        width='100%'
        height='100%'
        description={`"${props.children}" button`}
        url={`data:image/svg+xml;charset=UTF-8,
  <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  
  <!-- Button Shadow -->
  <rect x="0" y="10" width="${width}" height="34" rx="4" ry="4" fill="${cssHex(
    paletteBlack,
  )}" opacity="0.5" />
  
  <!-- Button Side: Stroke -->
  <rect x="0" y="6" width="${width}" height="34" rx="4" ry="4" fill="${cssHex(
    paletteBlack,
  )}" />

  <!-- Button Side: Fill -->
  <rect x="1" y="7" width="${
    width - 2
  }" height="32" rx="3" ry="3" fill="${color}" />

  <!-- Button Side: Tint -->
  <rect x="1" y="7" width="${
    width - 2
  }" height="32" rx="3" ry="3" fill="${cssHex(paletteBlack)}" opacity="0.5" />
  
  <!-- Front: Stroke -->
  <rect x="0" y="0" width="${width}" height="34" rx="4" ry="4" fill="${cssHex(
    paletteBlack,
  )}" />

  <!-- Front: Fill -->
  <rect x="1" y="1" width="${
    width - 2
  }" height="32" rx="3" ry="3" fill="${color}" />

  <!-- Front: Highlight -->
  <rect x="4" y="2" width="${
    width - 8
  }" height="3" rx="1.5" ry="1.5" fill="${cssHex(
    paletteWhite,
  )}" opacity="0.6" />
  </svg>`}
      />
      <vstack height='100%' width='100%' alignment='top center'>
        <spacer height='6px' />
        <PixelText
          pixelRatio={pixelRatio}
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
