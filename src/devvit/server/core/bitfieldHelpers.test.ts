import {expect, it} from 'vitest'
import {decodeVTT, encodeVTT, parseBitfieldToFlatArray} from './bitfieldHelpers'

it('encodeVTT - encodes claimed and team', () => {
  expect(encodeVTT(0, 0)).toBe(0)
  expect(encodeVTT(1, 0)).toBe(4)
  expect(encodeVTT(1, 3)).toBe(7)
})

it('decodeVTT - decodes claimed and team', () => {
  expect(decodeVTT(0)).toStrictEqual({claimed: 0, team: 0})
  expect(decodeVTT(4)).toStrictEqual({claimed: 1, team: 0})
  expect(decodeVTT(7)).toStrictEqual({claimed: 1, team: 3})
})

it('parseBitfieldToFlatArray - should correctly parse a 1x1 pixel from a single byte', () => {
  // We'll have just 1 entry (3 bits).
  // Example: claimed=1, team=3 => encodeVTT(1,3) = 0b111 = 7 decimal
  // We only need 3 bits. Let's store them in the top bits of the single byte:
  // If the offset=0 means the MSB, then those 3 bits are b111xxxxx => 0b11100000 => 0xE0
  const buf = Buffer.from([0b11100000]) // 0xE0
  const width = 1
  const height = 1

  expect(parseBitfieldToFlatArray(buf, width, height)).toStrictEqual([7])
})
