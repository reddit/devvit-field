import {Devvit} from '@devvit/public-api'
import Glyphs from '../data/font.json' assert {type: 'json'}

const DEFAULT_SIZE = 11
const GLYPH_HEIGHT = 14
const GLYPH_WIDTH = 7

type PixelTextProps = {
  // I take a key, but can't apply it to the image element. yolo.
  key?: string
  children: string | string[]
  size?: number
  color?: `#${string}`
  pixelRatio: number
  opacity?: number
  underline?: boolean
}

export function PixelText(props: PixelTextProps): JSX.Element {
  const {
    children,
    size = DEFAULT_SIZE,
    color = '#ff00ff',
    pixelRatio,
    opacity = 1,
  } = props

  // check if children is a string or an array of strings
  const childrenArray = Array.isArray(children) ? children : [children]

  const line = childrenArray[0]?.split('') ?? []

  let xOffset = 0
  const characters: string[] = []
  for (const character of line) {
    if (!(character in Glyphs)) {
      xOffset += GLYPH_WIDTH
      continue
    }

    characters.push(`<path
        d="${Glyphs[character as keyof typeof Glyphs]}"
        transform="translate(${xOffset} 0)"
        fill-rule="evenodd"
        clip-rule="evenodd"
        fill="${color}"
      />`)
    xOffset += GLYPH_WIDTH
  }

  const width = line.length * GLYPH_WIDTH
  const height = GLYPH_HEIGHT
  const scaledHeight = Math.round((GLYPH_HEIGHT / DEFAULT_SIZE) * size)
  const scaledWidth = Math.round(
    (GLYPH_WIDTH / DEFAULT_SIZE) * size * line.length,
  )

  return (
    <image
      imageHeight={`${scaledHeight * pixelRatio}px`} // Raster size
      imageWidth={`${scaledWidth * pixelRatio}px`} // Raster size
      height={`${scaledHeight}px`} // Block size
      width={`${scaledWidth}px`} // Block size
      description={childrenArray[0]}
      resizeMode='fill'
      url={`data:image/svg+xml;charset=UTF-8,
          <svg
              width="${scaledWidth}"
              height="${scaledHeight}"
              viewBox="0 0 ${width} ${height}"
              xmlns="http://www.w3.org/2000/svg"
          >
              <g opacity="${opacity}">
            ${characters.join('')}
            ${
              props.underline
                ? `<rect x="0" y="12" width="${width}" height="1" fill="${color}" />`
                : ''
            }
            </g>
          </svg>
        `}
    />
  )
}

export function getGlyphWidth(size: number): number {
  return GLYPH_WIDTH * (size / DEFAULT_SIZE)
}

export function getGlyphHeight(size: number): number {
  return GLYPH_HEIGHT * (size / DEFAULT_SIZE)
}

export function getBoundingBoxWidth(text: string, size: number): number {
  return text.length * GLYPH_WIDTH * (size / DEFAULT_SIZE)
}

export function getBoundingBoxHeight(size: number): number {
  return GLYPH_HEIGHT * (size / DEFAULT_SIZE)
}
