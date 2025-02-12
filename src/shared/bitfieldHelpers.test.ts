import {expect, it} from 'vitest'
import {decodeVTT, encodeVTT} from './bitfieldHelpers'

it('encodeVTT - encodes claimed and team', () => {
  expect(encodeVTT(0, 0)).toBe(0)
  expect(encodeVTT(1, 0)).toBe(4)
  expect(encodeVTT(1, 3)).toBe(7)
})

it('decodeVTT - decodes claimed and team', () => {
  expect(decodeVTT(0)).toEqual({claimed: 0, team: 0})
  expect(decodeVTT(4)).toEqual({claimed: 1, team: 0})
  expect(decodeVTT(7)).toEqual({claimed: 1, team: 3})
})
