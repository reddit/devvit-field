import {expect, it} from 'vitest'
import {getPartitionCoords} from './partition'

it('getPartitionCoords - should return the partition given the coords', () => {
  expect(getPartitionCoords({x: 0, y: 0}, 10)).toEqual({
    partitionX: 0,
    partitionY: 0,
  })
  expect(getPartitionCoords({x: 10, y: 10}, 10)).toEqual({
    partitionX: 1,
    partitionY: 1,
  })
})
