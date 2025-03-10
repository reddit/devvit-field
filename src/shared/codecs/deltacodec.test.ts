import {describe, expect, test} from 'vitest'
import type {Delta} from '../types/field'
import {DeltaCodec} from './deltacodec'

describe('DeltaCodec', () => {
  test('round trip', () => {
    const codec = new DeltaCodec({x: 1, y: 2}, 800)
    const orig: Delta[] = [
      {globalXY: {x: 800, y: 1600}, isBan: false, team: 1},
      {globalXY: {x: 1599, y: 2399}, isBan: true, team: 2},
    ]
    const encoded = codec.encode(orig)
    const decoded = codec.decode(encoded)
    expect(decoded).toStrictEqual(orig)
  })
})
