import {cssHex, paletteBlack} from '../theme'
import {type Level, levelHighlightColor} from '../types/level'

export function createDialogBadge(level: Level): string {
  const border = `<rect width="26" height="26" rx="5" ry="5" fill="${cssHex(levelHighlightColor[level])}" />`

  const background = `<rect x="2" y="2" width="22" height="22" rx="3" ry="3" fill="${cssHex(paletteBlack)}" />`

  const symbol = `<path d='M7 7h4v4h4v-4h4v4h-4v4h4v4h-4v-4h-4v4h-4v-4h4v-4h-4Z' fill="${cssHex(levelHighlightColor[level])}" />`

  return `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">${border}${background}${symbol}</svg>`
}
