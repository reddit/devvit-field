import {describe, expect, it} from 'vitest'
import {diffArrays} from './util'

describe('diffArrays', () => {
  it('should return correct results when string arrays have duplicates, items to unsubscribe, and items to subscribe', () => {
    const oldList = ['apple', 'banana', 'orange', 'grape']
    const newList = ['banana', 'orange', 'kiwi', 'melon']

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: ['banana', 'orange'],
      toUnsubscribe: ['apple', 'grape'],
      toSubscribe: ['kiwi', 'melon'],
    })
  })

  it('should return empty arrays when both input arrays are empty', () => {
    const oldList: string[] = []
    const newList: string[] = []

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: [],
      toUnsubscribe: [],
      toSubscribe: [],
    })
  })

  it('should handle completely different string arrays', () => {
    const oldList = ['apple', 'banana']
    const newList = ['kiwi', 'melon']

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: [],
      toUnsubscribe: ['apple', 'banana'],
      toSubscribe: ['kiwi', 'melon'],
    })
  })

  it('should handle identical string arrays', () => {
    const oldList = ['apple', 'banana', 'orange']
    const newList = ['apple', 'banana', 'orange']

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: ['apple', 'banana', 'orange'],
      toUnsubscribe: [],
      toSubscribe: [],
    })
  })

  it('should handle when oldList is empty', () => {
    const oldList: string[] = []
    const newList = ['apple', 'banana', 'orange']

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: [],
      toUnsubscribe: [],
      toSubscribe: ['apple', 'banana', 'orange'],
    })
  })

  it('should handle when newList is empty', () => {
    const oldList = ['apple', 'banana', 'orange']
    const newList: string[] = []

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: [],
      toUnsubscribe: ['apple', 'banana', 'orange'],
      toSubscribe: [],
    })
  })

  it('should return correct results with number arrays', () => {
    const oldList = [1, 2, 3, 4]
    const newList = [3, 4, 5, 6]

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: [3, 4],
      toUnsubscribe: [1, 2],
      toSubscribe: [5, 6],
    })
  })

  it('should work with mixed string and number arrays', () => {
    const oldList = ['1', 2, '3', 4]
    const newList = [2, '3', 4, '5']

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: [2, '3', 4],
      toUnsubscribe: ['1'],
      toSubscribe: ['5'],
    })
  })

  it('should handle arrays with falsy values correctly', () => {
    const oldList = ['', 0]
    const newList = [0, '']

    const result = diffArrays(oldList, newList)

    expect(result).toStrictEqual({
      duplicates: ['', 0],
      toUnsubscribe: [],
      toSubscribe: [],
    })
  })
})
