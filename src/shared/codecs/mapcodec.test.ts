import {describe, expect, test} from 'vitest'
import type {Team} from '../team'
import type {Cell} from '../types/field'
import {MapCodec} from './mapcodec'

const hidden: Cell = undefined

function claimed(t: number): Cell {
  return {isBan: false, team: t as Team}
}

function mine(t: number): Cell {
  return {isBan: true, team: t as Team}
}

function shuffle(length: number): Cell[] {
  const rotation: Cell[] = [
    claimed(0),
    claimed(1),
    claimed(2),
    claimed(3),
    mine(0),
    mine(1),
    mine(2),
    mine(3),
  ]
  const cells = new Array<Cell>(length)
  for (let i = 0; i < length; i++) {
    cells[i] = rotation[i % rotation.length]!
  }
  return cells
}

describe('MapCodec', () => {
  const codec = new MapCodec()
  const testCases: {
    name: string
    cells: Cell[]
    validate?: (bytes: Uint8Array) => void
  }[] = [
    {
      name: 'small empty partition',
      cells: Array(4 * 4).fill(hidden),
    },
    {
      name: 'small random partition',
      cells: shuffle(4 * 4),
    },
    {
      name: 'large empty partition',
      cells: Array(800 * 800).fill(hidden),
    },
    {
      name: 'large random partition',
      cells: shuffle(800 * 800),
    },
    {
      name: 'run of length 7',
      cells: [
        hidden,
        hidden,
        hidden,
        hidden,
        hidden,
        hidden,
        hidden,
        claimed(1),
      ],
    },
  ]
  for (const {name, cells, validate} of testCases) {
    test(name, () => {
      const bytes = codec.encode(cells.values())
      console.log(`${name}: encoded ${cells.length} into ${bytes.length} bytes`)
      const copy = [...codec.decode(bytes)]
      expect(copy).toStrictEqual(cells)
      if (validate) {
        validate(bytes)
      }
    })
  }
})
