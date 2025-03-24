import {
  cssHex,
  paletteBlack,
  paletteConsole,
  paletteShade80,
  paletteTint6,
  paletteTint19,
} from '../theme'
import {
  CAP_HEIGHT,
  CAP_WIDTH,
  HALF_STROKE,
  MIDDLE_WIDTH,
  RADIUS,
  TITLE_NOTCH_HEIGHT,
  TITLE_NOTCH_WIDTH,
} from './footerSettings'

function createTextureLine(x: number, y: number, flip?: boolean): string {
  return [
    `M${x},${y}`,
    `h${flip ? '-' : ''}8`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}8`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}8`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}8`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}22`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}22`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}8,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}3`,
    `m${flip ? '-' : ''}3,0`,
    `h${flip ? '-' : ''}22`,
  ].join('')
}

/*
 * Background: Middle Section
 */

export function createFooterMiddle(): string {
  const mid = MIDDLE_WIDTH / 2

  const bottomTint = ['M0,76', `H${MIDDLE_WIDTH}`, 'V100', 'H0']

  const insetContainer = [
    'M0,8',
    `H${MIDDLE_WIDTH}`,
    `M${CAP_WIDTH},76`,
    `H${MIDDLE_WIDTH}`,
  ]

  const wingsDark = [
    'M0,16',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    'M0,21',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},16`,
    `H${MIDDLE_WIDTH}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},21`,
    `H${MIDDLE_WIDTH}`,
  ]

  const wingsLight = [
    'M0,17',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    'M0,22',
    `H${mid - TITLE_NOTCH_WIDTH / 2 - RADIUS}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},17`,
    `H${MIDDLE_WIDTH}`,
    `M${mid + TITLE_NOTCH_WIDTH / 2 + RADIUS},22`,
    `H${MIDDLE_WIDTH}`,
  ]

  const titleNotch = [
    `M${mid - TITLE_NOTCH_WIDTH / 2},${HALF_STROKE + 8}`,
    `L${mid - TITLE_NOTCH_WIDTH / 2 + TITLE_NOTCH_HEIGHT},${HALF_STROKE + 8 + TITLE_NOTCH_HEIGHT}`,
    `H${mid + TITLE_NOTCH_WIDTH / 2 - TITLE_NOTCH_HEIGHT}`,
    `L${mid + TITLE_NOTCH_WIDTH / 2},${HALF_STROKE + 8}`,
  ]

  const cx1 = mid - TITLE_NOTCH_WIDTH / 2
  const cx2 = mid + TITLE_NOTCH_WIDTH / 2

  const logoNotch = [
    `M${cx1 - RADIUS},${76}`,
    `C${cx1},${76} ${cx1},${76 - 12} ${cx1 + RADIUS},${76 - 12}`,
    `H${cx2 - RADIUS}`,
    `C${cx2},${76 - 12} ${cx2},${76} ${cx2 + RADIUS},${76}`,
    `H${cx2 + RADIUS}`,
    'Z',
  ]

  const bottomRidgeTop = [
    `M0,${84}`,
    `H${cx1 - RADIUS}`,
    `C${cx1},${84} ${cx1},${84 + 12} ${cx1 + RADIUS},${84 + 12}`,
    `H${cx2 - RADIUS}`,
    `C${cx2},${84 + 12} ${cx2},${84} ${cx2 + RADIUS},${84}`,
    `H${MIDDLE_WIDTH}`,
  ]

  const bottomRidgeBottom = [
    `M0,${85}`,
    `H${cx1 - 1 - RADIUS}`,
    `C${cx1 - 1},${85} ${cx1 - 1},${85 + 12} ${cx1 - 1 + RADIUS},${85 + 12}`,
    `H${cx2 + 1 - RADIUS}`,
    `C${cx2 + 1},${85 + 12} ${cx2 + 1},${85} ${cx2 + 1 + RADIUS},${85}`,
    `H${MIDDLE_WIDTH}`,
  ]

  return `<svg viewBox="0 0 ${MIDDLE_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${cssHex(paletteConsole)}" /><path d="${titleNotch.join('')}${bottomTint.join('')}${logoNotch.join('')}" fill="${cssHex(paletteBlack)}" /><path d="${insetContainer.join('')}${createTextureLine(cx2 + 16, 69)}${createTextureLine(cx1 - 16, 69, true)}" stroke-width="1" stroke="${cssHex(paletteBlack)}" fill="none" /><path d="${wingsDark.join('')}" stroke-width="1" stroke="${cssHex(paletteShade80)}" fill="none" /><path d="${wingsLight.join('')}${bottomRidgeTop.join('')}${createTextureLine(cx2 + 16, 68)}${createTextureLine(cx1 - 16, 68, true)}" stroke-width="1" stroke="${cssHex(paletteTint19)}" fill="none" /><path d="${bottomRidgeBottom.join('')}" stroke-width="1" stroke="${cssHex(paletteTint6)}" fill="none" /></svg>`
}
