import {cssHex, paletteBlack, paletteConsole, paletteShade19} from '../theme'
import {CAP_HEIGHT, CAP_WIDTH, RADIUS} from './footerSettings'

export function createFooterEnd(): string {
  const shadow = [
    'M0,8',
    `H${CAP_WIDTH - RADIUS - 8}`,
    `Q${CAP_WIDTH - 8},8 ${CAP_WIDTH - 8},${8 + RADIUS}`,
    `V${84 - RADIUS}`,
    `Q${CAP_WIDTH - 8},${84} ${CAP_WIDTH - RADIUS - 8},${84}`,
    'H0',
  ]
  const bottomTint = [
    'M0,16',
    `H${CAP_WIDTH - RADIUS - 16}`,
    `Q${CAP_WIDTH - 16},16 ${CAP_WIDTH - 16},${16 + RADIUS}`,
    `V${100 - RADIUS}`,
    `Q${CAP_WIDTH - 16},${100} ${CAP_WIDTH - RADIUS - 16},${100}`,
    'H0',
  ]

  const insetContainer = [
    'M0,8',
    `H${CAP_WIDTH - RADIUS - 8}`,
    `Q${CAP_WIDTH - 8},8 ${CAP_WIDTH - 8},${8 + RADIUS}`,
    `V${76 - RADIUS}`,
    `Q${CAP_WIDTH - 8},${76} ${CAP_WIDTH - RADIUS - 8},${76}`,
    'H0',
  ]

  return `<svg width="${CAP_WIDTH}" height="${CAP_HEIGHT}" viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${shadow.join('')}" fill="${cssHex(paletteShade19)}" /><path d="${bottomTint.join('')}" fill="${cssHex(paletteBlack)}" /><path d="${insetContainer.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="${cssHex(paletteConsole)}" /></svg>`
}
