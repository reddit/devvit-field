import type {WH} from './types/2d.ts'

// to-do: fix me!!!

export const paletteBlack: number = 0x000000ff
export const paletteJuiceBox: number = 0x6b92f2ff
export const paletteFlamingo: number = 0xcc3a83ff
export const paletteLasagna: number = 0xea6126ff
export const paletteSunshine: number = 0xeda635ff
export const paletteBanBox: number = 0x7dff00ff

export const spacePx: number = 8

export const minCanvasWH: Readonly<WH> = {w: 512, h: 512}

export const fontMSize: number = 12

export const playButtonWidth: number = 160 // to-do: fix.

export const thinStroke: number = 2 // to-do: fix.

export const scoreboardSize: number = 25

export const radius: number = spacePx // to-do: fix.

export const minButtonSize: number = 144 // to-do: fix.

export const uiScaleMax: number = 4 // to-do: fix.

export const peerDisconnectIntervalMillis: number = 1_000
export const peerDefaultDisconnectMillis: number = 5_000
export const peerMaxSyncInterval: number = 1_000

export function cssHex(val: number): string {
  return `#${val.toString(16).padStart(8, '0')}`
}
