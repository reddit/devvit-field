import {cssHex, paletteBlack, paletteField} from '../theme'

type Options = {
  height: number
  width: number
  backgroundColor?: string
  borderColor?: string
  shadowColor?: string
}

export function createBorderedContainer(options: Options): string {
  const DEFAULT_BACKGROUND_COLOR = cssHex(paletteBlack)
  const DEFAULT_BORDER_COLOR = cssHex(paletteField)
  const DEFAULT_SHADOW_COLOR = cssHex(paletteBlack)

  // Rectangle Primitive
  const rect = (x: number, y: number, width: number, height: number) =>
    `M${x} ${y}h${width}v${height}h-${width}v-${height}`

  // Background
  const background = `<path d="${rect(4, 4, options.width - 8, options.height - 8)}Z" fill="${options.backgroundColor ?? DEFAULT_BACKGROUND_COLOR}" />`

  // Border
  const borderSegments: string[] = [
    // Top Left Corner
    'M6 2h2v4h-2v2h-4v-2h2v-2h2v-2',
    // Top Right Corner
    `M${options.width - 8} 2h2v2h2v2h2v2h-4v-2h-2v-4`,
    // Bottom Right Corner
    `M${options.width - 6} ${options.height - 8}h4v2h-2v2h-2v2h-2v-4h2v-2`,
    // Bottom Left Corner
    `M2 ${options.height - 8}h4v2h2v4h-2v-2h-2v-2h-2v-2`,
    // Top Edge (X,Y,W,H)
    rect(8, 2, options.width - 16, 2),
    // Right Edge (X,Y,W,H)
    rect(options.width - 4, 8, 2, options.height - 16),
    // Bottom Edge (X,Y,W,H)
    rect(8, options.height - 4, options.width - 16, 2),
    // Left Edge (X,Y,W,H)
    rect(2, 8, 2, options.height - 16),
  ]
  const border = `<path d="${borderSegments.join('')}Z" fill="${options.borderColor ?? DEFAULT_BORDER_COLOR}" />`

  // Shadow
  const shadowSegments: string[] = [
    // Right Edge
    rect(options.width - 2, 8, 2, options.height - 14),
    // Bottom Right Corner
    `M${options.width - 4} ${options.height - 6}h4v2h-2v2h-2v2h-2v-4h2v-2`,
    // Bottom Edge
    rect(8, options.height - 2, options.width - 14, 2),
  ]
  const shadow = `<path d="${shadowSegments.join('')}Z" fill="${options.shadowColor ?? DEFAULT_SHADOW_COLOR}" />`

  // Drawing Order for Layers
  const drawOrder = [background, border, shadow]

  return `<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" fill="none" xmlns="http://www.w3.org/2000/svg">${drawOrder.join('')}</svg>`
}
