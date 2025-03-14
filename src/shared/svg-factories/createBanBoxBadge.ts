import {
  cssHex,
  paletteField,
  paletteFieldDark,
  paletteFieldLight,
} from '../theme'

export function createBanBoxBadge(): string {
  // const size = 25

  // Border Segments
  const borderSegments = [
    // Outer Ring
    'M0 0h25v25h-25v-25',
    // Inner Ring
    'M1 1h23v23h-23v-23',
  ]

  const border = `<path d="${borderSegments.join('')}Z" fill="${cssHex(paletteField)}" fill-rule="evenodd" clip-rule="evenodd" />`

  const background = `<path d="M0 0h25v25h-25Z" fill="${cssHex(paletteFieldDark)}" />`

  const symbol = `<path d='M4.5 4.5h5.33v5.33h5.33v-5.33h5.33v5.33h-5.33v5.33h5.33v5.33h-5.33v-5.33h-5.33v5.33h-5.33v-5.33h5.33v-5.33h-5.33Z' fill="${cssHex(paletteFieldLight)}" />`

  return `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">${background}${border}${symbol}</svg>`
}
