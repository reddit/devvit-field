import {describe, expect, it} from 'vitest'
import {abbreviateNumber, hydrateString, padNumber} from './format.js'

describe('abbreviateNumber', () => {
  it('should abbreviate numbers correctly', () => {
    expect(abbreviateNumber(1000)).toBe('1.0K')
    expect(abbreviateNumber(1000000)).toBe('1.0M')
    expect(abbreviateNumber(1000000000)).toBe('1.0B')
    expect(abbreviateNumber(999)).toBe('999')
  })
})

describe('hydrateString', () => {
  it('should replace tokens with corresponding values from data object', () => {
    const template = 'Hello, {name}!'
    const data = {name: 'World'}
    expect(hydrateString(template, data)).toBe('Hello, World!')
  })

  it('should leave tokens unchanged if not found in data object', () => {
    const template = 'Hello, {name}!'
    const data = {}
    expect(hydrateString(template, data)).toBe('Hello, {name}!')
  })

  it('should handle multiple tokens', () => {
    const template = 'Hello, {name}! Today is {day}.'
    const data = {name: 'World', day: 'Monday'}
    expect(hydrateString(template, data)).toBe('Hello, World! Today is Monday.')
  })
})

describe('padNumber', () => {
  it('should pad numbers with leading zeros', () => {
    expect(padNumber(5, 3)).toBe('005')
    expect(padNumber(123, 5)).toBe('00123')
  })

  it('should not pad numbers if length is less than or equal to number length', () => {
    expect(padNumber(123, 3)).toBe('123')
    expect(padNumber(12345, 3)).toBe('12345')
  })
})
