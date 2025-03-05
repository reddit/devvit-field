import {describe, expect, it} from 'vitest'
import {abbreviateNumber} from './format.js'

describe('abbreviateNumber', () => {
  it('should abbreviate numbers correctly', () => {
    expect(abbreviateNumber(1000)).toBe('1.0K')
    expect(abbreviateNumber(1000000)).toBe('1.0M')
    expect(abbreviateNumber(1000000000)).toBe('1.0B')
    expect(abbreviateNumber(999)).toBe('999')
  })
})
