import type {WH} from './types/2d.ts'

// Basic colors
export const paletteBlack: number = 0x000000ff
export const paletteWhite: number = 0xffffffff

// Graytones
export const paletteShade19: number = 0x00000030
export const paletteShade50: number = 0x00000080
export const paletteShade60: number = 0x00000099
export const paletteShade80: number = 0x000000cd
export const paletteTint6: number = 0xffffff0f
export const paletteTint19: number = 0xffffff30
export const paletteTint60: number = 0xffffff99
export const paletteTint75: number = 0xffffffb0

// UI element colors
export const paletteConsole: number = 0x1f2430ff
export const paletteOffline: number = 0xff0000ff
export const paletteDisabled: number = 0x505050ff

// Team colors
export const paletteFlamingo: number = 0xbc4681ff // oklch(57.17% 0.1632 352.48)
export const paletteJuiceBox: number = 0x7391ebff // oklch(67.36% 0.1379 268.6)
export const paletteLasagna: number = 0xda6939ff // oklch(64.8% 0.1549 42.23)
export const paletteSunshine: number = 0xe2a94dff // oklch(77.11% 0.127 76.74)

// Level colors
export const paletteField: number = 0x0a7f18ff
export const paletteFieldLight: number = 0x7dff00ff
export const paletteFieldDark: number = 0x002e00ff
export const paletteBannedField: number = 0xb72216ff
export const paletteBannedFieldLight: number = 0xff7260ff
export const paletteBannedFieldDark: number = 0x380c09ff
export const paletteBlandBlue: number = 0x5f86d0ff
export const paletteVeryBannedField: number = 0x1897b5ff
export const paletteVeryBannedFieldLight: number = 0x1ad0b3ff
export const paletteVeryBannedFieldDark: number = 0x07232aff
export const paletteBananaField: number = 0xe5ba05ff
export const paletteBananaFieldLight: number = 0xfaeb25ff
export const paletteBananaFieldDark: number = 0x2c2401ff
export const paletteWhatIsField: number = 0xa955b7ff
export const paletteWhatIsFieldLight: number = 0xda57fbff
export const paletteWhatIsFieldDark: number = 0x300f38ff

// Used to determine which resolution to render SVGs at if context is not available (e.g. in a preview state).
export const fallbackPixelRatio: number = 2

export const minCanvasWH: Readonly<WH> = {w: 288, h: 320}

// Typography
export const fontSSize: number = 12
export const fontMSize: number = 16
export const fontLSize: number = 22

// Styles
export const spacePx: number = 8
export const thinStroke: number = 1
export const radiusPx: number = spacePx / 2

export const peerDisconnectIntervalMillis: number = 1_000
export const peerDefaultDisconnectMillis: number = 5_000
export const peerMaxSyncInterval: number = 1_000 // to-do: fix.

export const partitionConnectionUpdateInterval: number = 5_000

export const consoleBorderW: number = 16

export function cssHex(val: number): `#${string}` {
  return `#${val.toString(16).padStart(8, '0')}`
}
