import type {WH} from './types/2d.ts'

export const paletteBlack: number = 0x000000ff
export const paletteJuiceBox: number = 0x6b92f2ff
export const paletteFlamingo: number = 0xcc3a83ff
export const paletteLasagna: number = 0xea6126ff
export const paletteSunshine: number = 0xeda635ff
export const paletteBanBox: number = 0x7dff00ff
export const paletteSelected: number = 0xffffffff
export const paletteWaiting: number = 0x00ffffff
export const paletteLightGrey: number = 0xe0e0e0ff
export const paletteLightShade: number = 0x00000030
export const paletteHalfShade: number = 0x00000080

export const spacePx: number = 8

export const minCanvasWH: Readonly<WH> = {w: 288, h: 320}

export const fontMSize: number = 12

export const playButtonWidth: number = 240

export const thinStroke: number = 2 // to-do: fix.

export const radiusPx: number = spacePx / 4

export const peerDisconnectIntervalMillis: number = 1_000
export const peerDefaultDisconnectMillis: number = 5_000
export const peerMaxSyncInterval: number = 1_000 // to-do: fix.

export const partitionConnectionUpdateInterval: number = 5_000

export function cssHex(val: number): `#${string}` {
  return `#${val.toString(16).padStart(8, '0')}`
}
