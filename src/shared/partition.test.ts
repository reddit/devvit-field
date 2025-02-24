import {expect, it} from 'vitest'
import {
  getGlobalCoords,
  getLocalCoords,
  getPartitionAndLocalCoords,
  getPartitionCoords,
  parsePartitionXY,
} from './partition'

it('parsePartitionXY', () => {
  expect(parsePartitionXY('px_0__py_0')).toEqual({x: 0, y: 0})
  expect(parsePartitionXY('px_123__py_456')).toEqual({x: 123, y: 456})
  expect(parsePartitionXY('px_000__py_000')).toEqual({x: 0, y: 0})

  // @ts-expect-error
  expect(() => parsePartitionXY('px_foo__py_foo')).toThrowError()
  expect(() => parsePartitionXY('px_3.4__py_4.5')).toThrowError()
  expect(() => parsePartitionXY('px_-1__py_5')).toThrowError()
})

it('getPartitionCoords', () => {
  expect(getPartitionCoords({x: 0, y: 0}, 10)).toEqual({
    x: 0,
    y: 0,
  })
  expect(getPartitionCoords({x: 10, y: 10}, 10)).toEqual({
    x: 1,
    y: 1,
  })
  expect(getPartitionCoords({x: 10, y: 20}, 10)).toEqual({
    x: 1,
    y: 2,
  })
  expect(getPartitionCoords({x: 20, y: 10}, 10)).toEqual({
    x: 2,
    y: 1,
  })
})

it('getLocalCoords', () => {
  expect(getLocalCoords({x: 0, y: 0}, 10)).toEqual({x: 0, y: 0})
  expect(getLocalCoords({x: 5, y: 5}, 10)).toEqual({x: 5, y: 5})
  expect(getLocalCoords({x: 55, y: 55}, 10)).toEqual({x: 5, y: 5})
  expect(getLocalCoords({x: 1, y: 1}, 10)).toEqual({x: 1, y: 1})
  expect(getLocalCoords({x: 0, y: 0}, 10)).toEqual({x: 0, y: 0})
  expect(getLocalCoords({x: 11, y: 11}, 10)).toEqual({x: 1, y: 1})
})

it('getPartitionAndLocalCoords', () => {
  expect(getPartitionAndLocalCoords({x: 0, y: 0}, 10)).toEqual({
    partitionXY: {x: 0, y: 0},
    localXY: {x: 0, y: 0},
  })
  expect(getPartitionAndLocalCoords({x: 10, y: 10}, 10)).toEqual({
    partitionXY: {x: 1, y: 1},
    localXY: {x: 0, y: 0},
  })
  expect(getPartitionAndLocalCoords({x: 11, y: 11}, 10)).toEqual({
    partitionXY: {x: 1, y: 1},
    localXY: {x: 1, y: 1},
  })
  expect(getPartitionAndLocalCoords({x: 12, y: 11}, 10)).toEqual({
    partitionXY: {x: 1, y: 1},
    localXY: {x: 2, y: 1},
  })
  expect(getPartitionAndLocalCoords({x: 11, y: 12}, 10)).toEqual({
    partitionXY: {x: 1, y: 1},
    localXY: {x: 1, y: 2},
  })
})

it('getGlobalCoords', () => {
  expect(getGlobalCoords({x: 0, y: 0}, {x: 0, y: 0}, 10)).toEqual({x: 0, y: 0})
  expect(getGlobalCoords({x: 1, y: 1}, {x: 0, y: 0}, 10)).toEqual({
    x: 10,
    y: 10,
  })
  expect(getGlobalCoords({x: 1, y: 1}, {x: 1, y: 1}, 10)).toEqual({
    x: 11,
    y: 11,
  })
  expect(getGlobalCoords({x: 1, y: 1}, {x: 2, y: 1}, 10)).toEqual({
    x: 12,
    y: 11,
  })
  expect(getGlobalCoords({x: 1, y: 1}, {x: 1, y: 2}, 10)).toEqual({
    x: 11,
    y: 12,
  })
})
