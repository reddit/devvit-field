import {describe, expect, it} from 'vitest'
import {createCrtLines} from './createCrtLines.js'

describe('createCrtLines', () => {
  it('Provides the correct crt lines syntax', () => {
    expect(
      createCrtLines({
        height: 100,
        width: 100,
      }),
    ).toBe(
      '<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6H94M6 8H94M6 10H94M6 12H94M6 14H94M6 16H94M6 18H94M6 20H94M6 22H94M6 24H94M6 26H94M6 28H94M6 30H94M6 32H94M6 34H94M6 36H94M6 38H94M6 40H94M6 42H94M6 44H94M6 46H94M6 48H94M6 50H94M6 52H94M6 54H94M6 56H94M6 58H94M6 60H94M6 62H94M6 64H94M6 66H94M6 68H94M6 70H94M6 72H94M6 74H94M6 76H94M6 78H94M6 80H94M6 82H94M6 84H94M6 86H94M6 88H94M6 90H94M6 92H94" stroke="#000000ff" stroke-width="0.5" /></svg>',
    )
  })
})
