import {cssHex, paletteBlack, paletteConsole, paletteShade19} from '../theme'
import {CAP_HEIGHT, CAP_WIDTH, RADIUS} from './footerSettings'

export function createFooterStart(): string {
  const shadow = [
    `M${CAP_WIDTH},8`,
    `H${8 + RADIUS}`,
    `Q8,8 8,${8 + RADIUS}`,
    `V${84 - RADIUS}`,
    `Q8,${84} ${8 + RADIUS},${84}`,
    `H${CAP_WIDTH}`,
  ]
  const bottomTint = [
    `M${CAP_WIDTH},16`,
    `H${16 + RADIUS}`,
    `Q16,16 16,${16 + RADIUS}`,
    `V${100 - RADIUS}`,
    `Q16,${100} ${16 + RADIUS},${100}`,
    `H${CAP_WIDTH}`,
  ]

  const insetContainer = [
    `M${CAP_WIDTH},8`,
    `H${8 + RADIUS}`,
    `Q8,8 8,${8 + RADIUS}`,
    `V${76 - RADIUS}`,
    `Q8,${76} ${8 + RADIUS},${76}`,
    `H${CAP_WIDTH}`,
  ]

  return `<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${shadow.join('')}" fill="${cssHex(paletteShade19)}" /><path d="${bottomTint.join('')}" fill="${cssHex(paletteBlack)}" /><path d="${insetContainer.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="${cssHex(paletteConsole)}" /></svg>`
}
