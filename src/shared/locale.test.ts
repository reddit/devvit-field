import {describe, expect, it} from 'vitest'
import {localize} from './locale'
import en from './locales/en.json' assert {type: 'json'}

describe('locale', () => {
  it('should return the correct translation for a given key', () => {
    const result = localize('dialog-button-label', 0)
    expect(result).toBe(en['dialog-button-label'])
  })
  it('should handle no locale', () => {
    const result = localize('dialog-button-label')
    expect(result).toBe(en['dialog-button-label'])
  })
})
