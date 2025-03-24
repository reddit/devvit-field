import {
  cssHex,
  paletteBlack,
  paletteShade80,
  paletteTint6,
  paletteTint19,
} from '../theme'
import {CAP_HEIGHT} from './footerSettings'

export function createFooterMiddleExtension(): string {
  const WIDTH = 1

  const bottomTint = ['M0,76', `H${WIDTH}`, 'V100', 'H0']
  const insetContainer = ['M0,8', `H${WIDTH}`, `M${WIDTH},76`, `H${WIDTH}`]
  const wingsDark = ['M0,16', `H${WIDTH}`, 'M0,21', `H${WIDTH}`]
  const wingsLight = ['M0,17', `H${WIDTH}`, 'M0,22', `H${WIDTH}`]
  const bottomRidgeTop = [`M0,${84}`, `H${WIDTH}`]
  const bottomRidgeBottom = [`M0,${85}`, `H${WIDTH}`]

  return `<svg preserveAspectRatio="none" viewBox="0 0 ${WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${bottomTint.join('')}" fill="${cssHex(paletteBlack)}" /><path d="${insetContainer.join('')}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="none" /><path d="${wingsDark.join('')}" stroke-width="1" stroke="${cssHex(paletteShade80)}" fill="none" /><path d="${wingsLight.join('')}${bottomRidgeTop.join('')}" stroke-width="1" stroke="${cssHex(paletteTint19)}" fill="none" /><path d="${bottomRidgeBottom.join('')}" stroke-width="1" stroke="${cssHex(paletteTint6)}" fill="none" /></svg>`
}
