import {beforeEach, describe, expect, test} from 'vitest'
import {Bitfield, getCell, setCell} from './bitfield.js'

describe('getCell()', () => {
  const arr = new Uint8Array([0b10101001, 0b10010101])

  test('1b', () => {
    let str = ''
    for (let i = 0; i < 16; i++) str += getCell(arr, i, 1).toString(16)
    expect(str).toBe('10101001' + '10010101')
  })

  test('2b', () => {
    let str = ''
    for (let i = 0; i < 8; i++) str += getCell(arr, i, 2).toString(16)
    expect(str).toBe('2221' + '2111')
  })

  test('3b', () => {
    let str = ''
    for (let i = 0; i < 5; i++) str += getCell(arr, i, 3).toString(16)
    expect(str).toBe('523' + '12')
  })

  test('4b', () => {
    let str = ''
    for (let i = 0; i < 4; i++) str += getCell(arr, i, 4).toString(16)
    expect(str).toBe('a9' + '95')
  })

  test('5b', () => {
    let str = ''
    for (let i = 0; i < 3; i++) str += getCell(arr, i, 5).toString(16)
    expect(str).toBe('156' + 'a')
  })

  test('6b', () => {
    let str = ''
    for (let i = 0; i < 2; i++) str += getCell(arr, i, 6).toString(16)
    expect(str).toBe('2a' + '19')
  })

  test('7b', () => {
    let str = ''
    for (let i = 0; i < 2; i++) str += getCell(arr, i, 7).toString(16)
    expect(str).toBe('54' + '65')
  })

  test('8b', () => {
    let str = ''
    for (let i = 0; i < 2; i++) str += getCell(arr, i, 8).toString(16)
    expect(str).toBe('a9' + '95')
  })
})

describe('setCell()', () => {
  let arr: Uint8Array
  beforeEach(() => (arr = new Uint8Array([0, 0])))

  test('1b', () => {
    const str = '10101001' + '10010101'
    for (let i = 0; i < str.length; i++)
      setCell(arr, i, 1, parseInt(str[i]!, 2))
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010101]))
  })

  test('2b', () => {
    const str = '2221' + '2111'
    for (let i = 0; i < str.length; i++)
      setCell(arr, i, 2, parseInt(str[i]!, 4))
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010101]))
  })

  test('3b', () => {
    const str = '523' + '12'
    for (let i = 0; i < str.length; i++)
      setCell(arr, i, 3, parseInt(str[i]!, 8))
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010100]))
  })

  test('4b', () => {
    const str = 'a9' + '95'
    for (let i = 0; i < str.length; i++)
      setCell(arr, i, 4, parseInt(str[i]!, 16))
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010101]))
  })

  test('5b', () => {
    setCell(arr, 0, 5, 0b10101)
    setCell(arr, 1, 5, 0b00110)
    setCell(arr, 2, 5, 0b01010)
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010100]))
  })

  test('6b', () => {
    setCell(arr, 0, 6, 0b101010)
    setCell(arr, 1, 6, 0b011001)
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010000]))
  })

  test('7b', () => {
    setCell(arr, 0, 7, 0b1010100)
    setCell(arr, 1, 7, 0b1100101)
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010100]))
  })

  test('8b', () => {
    setCell(arr, 0, 8, 0b10101001)
    setCell(arr, 1, 8, 0b10010101)
    expect(arr).toStrictEqual(new Uint8Array([0b10101001, 0b10010101]))
  })
})

describe('1x1 3x3 8b', () => {
  let field: Bitfield
  beforeEach(() => (field = new Bitfield({w: 1, h: 1}, {w: 3, h: 3}, 8)))

  test('invalid', () => {
    field.setCell({x: -1, y: -1}, 1)
    expect(field.getCell({x: -1, y: -1})).toBe(undefined)
    field.setCell({x: 0.1, y: 2}, 1)
    expect(field.getCell({x: 0.1, y: 2})).toBe(1)
    field.setCell({x: 0, y: 1.2}, 1)
    expect(field.getCell({x: 0, y: 1.2})).toBe(1)
    field.setCell({x: 3, y: 3}, 1)
    expect(field.getCell({x: 3, y: 3})).toBe(undefined)
    field.setCell({x: 0, y: 0}, 257)
    expect(field.getCell({x: 0, y: 0})).toBe(1)
  })

  test('init', () =>
    expect(field.toString()).toMatchInlineSnapshot(`
    "
    0 0 0 
    0 0 0 
    0 0 0 
    "
  `))

  test('fill', () => {
    field.setCell({x: 0, y: 0}, 1)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 
      0 0 0 
      0 0 0 
      "
    `)
    field.setCell({x: 1, y: 0}, 2)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 0 
      0 0 0 
      0 0 0 
      "
    `)
    field.setCell({x: 2, y: 0}, 3)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 3 
      0 0 0 
      0 0 0 
      "
    `)
    field.setCell({x: 0, y: 1}, 4)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 3 
      4 0 0 
      0 0 0 
      "
    `)
    field.setCell({x: 1, y: 1}, 5)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 3 
      4 5 0 
      0 0 0 
      "
    `)
    field.setCell({x: 2, y: 1}, 6)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 3 
      4 5 6 
      0 0 0 
      "
    `)
    field.setCell({x: 0, y: 2}, 7)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 3 
      4 5 6 
      7 0 0 
      "
    `)
    field.setCell({x: 1, y: 2}, 8)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 3 
      4 5 6 
      7 8 0 
      "
    `)
    field.setCell({x: 2, y: 2}, 9)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 2 3 
      4 5 6 
      7 8 9 
      "
    `)
  })
})

describe('2x3 4x5 3b', () => {
  let field: Bitfield
  beforeEach(() => (field = new Bitfield({w: 2, h: 3}, {w: 4, h: 5}, 3)))

  test('init', () =>
    expect(field.toString()).toMatchInlineSnapshot(`
    "
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    "
  `))

  test('zigzag', () => {
    field.setCell({x: 0, y: 0}, 1)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 1, y: 1}, 2)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 2, y: 2}, 3)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 3, y: 3}, 4)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 4, y: 4}, 5)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 5, y: 5}, 6)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 6, y: 6}, 7)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 7, y: 7}, 6)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 6, y: 8}, 5)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 5 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 5, y: 9}, 4)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 5 0 
      0 0 0 0 0 4 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 4, y: 10}, 3)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 5 0 
      0 0 0 0 0 4 0 0 
      0 0 0 0 3 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 3, y: 11}, 2)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 5 0 
      0 0 0 0 0 4 0 0 
      0 0 0 0 3 0 0 0 
      0 0 0 2 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 2, y: 12}, 1)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 5 0 
      0 0 0 0 0 4 0 0 
      0 0 0 0 3 0 0 0 
      0 0 0 2 0 0 0 0 
      0 0 1 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 1, y: 13}, 2)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 5 0 
      0 0 0 0 0 4 0 0 
      0 0 0 0 3 0 0 0 
      0 0 0 2 0 0 0 0 
      0 0 1 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 0 0 0 0 0 0 
      "
    `)
    field.setCell({x: 0, y: 14}, 3)
    expect(field.toString()).toMatchInlineSnapshot(`
      "
      1 0 0 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      0 0 3 0 0 0 0 0 
      0 0 0 4 0 0 0 0 
      0 0 0 0 5 0 0 0 
      0 0 0 0 0 6 0 0 
      0 0 0 0 0 0 7 0 
      0 0 0 0 0 0 0 6 
      0 0 0 0 0 0 5 0 
      0 0 0 0 0 4 0 0 
      0 0 0 0 3 0 0 0 
      0 0 0 2 0 0 0 0 
      0 0 1 0 0 0 0 0 
      0 2 0 0 0 0 0 0 
      3 0 0 0 0 0 0 0 
      "
    `)
  })
})
