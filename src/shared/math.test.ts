import {describe, expect, it} from 'vitest'
import {clamp} from './math.js'

describe('clamp', () => {
  it('should clamp numbers correctly', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
    expect(clamp(5, 10, 0)).toBe(5)
  })
})
