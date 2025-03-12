import type {V4} from '../types/v4.ts'

// @ts-expect-error
globalThis.crypto ??= {}
crypto.randomUUID ??= (): V4 => {
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) bytes[i] = Math.trunc(Math.random() * 256)
  // @ts-expect-error Template literal too cumbersome and not a real V4 anyway.
  return (
    // biome-ignore lint/style/useTemplate: <explanation>
    hex(bytes[0]!) +
    hex(bytes[1]!) +
    hex(bytes[2]!) +
    hex(bytes[3]!) +
    '-' +
    hex(bytes[4]!) +
    hex(bytes[5]!) +
    '-' +
    hex(bytes[6]!) +
    hex(bytes[7]!) +
    '-' +
    hex(bytes[8]!) +
    hex(bytes[9]!) +
    '-' +
    hex(bytes[10]!) +
    hex(bytes[11]!) +
    hex(bytes[12]!) +
    hex(bytes[13]!) +
    hex(bytes[14]!) +
    hex(bytes[15]!)
  )
}

function hex(byte: number) {
  return byte.toString(16).padStart(2, '0')
}
