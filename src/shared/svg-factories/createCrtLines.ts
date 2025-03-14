import {cssHex, paletteBlack} from '../theme'

type Options = {
  height: number
  width: number
  inset?: number
  distance?: number
  strokeWidth?: number
  strokeColor?: string
}

export function createCrtLines(options: Options): string {
  const {
    height,
    width,
    inset = 6,
    distance = 2,
    strokeWidth = 0.5,
    strokeColor = cssHex(paletteBlack),
  } = options

  const data: string[] = []
  for (let i = inset; i < height - inset; i += distance) {
    data.push(`M${inset} ${i}H${width - inset}`)
  }

  const path = `<path d="${data.join('')}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">${path}</svg>`
}
