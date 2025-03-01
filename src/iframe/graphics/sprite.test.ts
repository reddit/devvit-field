import {expect, test} from 'vitest'
import type {Anim} from './atlas.js'
import {Sprite} from './sprite.js'

test('bits', () => {
  const anim: Anim = {
    cels: 1,
    id: 0x7ff0,
    w: 1,
    h: 2,
    hitbox: {x: 0, y: 0, w: 2, h: 2},
    hurtbox: {x: 0, y: 0, w: 2, h: 2},
    offset: {
      '00': {x: 0, y: 0},
      '01': {x: 0, y: 0},
      10: {x: 0, y: 0},
      11: {x: 0, y: 0},
    },
    tag: 'file--Tag',
  }
  const sprite = new Sprite({anim: {'file--Tag': anim}, cels: []}, 'file--Tag')
  expect(sprite._iffzz).toBe(0b111111111110000_0_0_0_000)

  expect(sprite.flipX).toBe(false)
  sprite.flipX = true
  expect(sprite.flipX).toBe(true)
  expect(sprite._iffzz).toBe(0b111111111110000_1_0_0_000)

  expect(sprite.flipY).toBe(false)
  sprite.flipY = true
  expect(sprite.flipY).toBe(true)
  expect(sprite._iffzz).toBe(0b111111111110000_1_1_0_000)

  expect(sprite.cel).toBe(0)
  sprite.cel = 0xf
  expect(sprite.cel).toBe(0xf)
  expect(sprite._iffzz).toBe(0b111111111111111_1_1_0_000)

  expect(sprite.zend).toBe(false)
  sprite.zend = true
  expect(sprite.zend).toBe(true)
  expect(sprite._iffzz).toBe(0b111111111111111_1_1_1_000)

  expect(sprite.z).toBe(0)
  sprite.z = 7
  expect(sprite.z).toBe(7)
  expect(sprite._iffzz).toBe(0b111111111111111_1_1_1_111)

  expect(sprite.x).toBe(0)
  sprite.x = 1
  expect(sprite.x).toBe(1)
  sprite.x = 5
  expect(sprite.x).toBe(5)
  expect(sprite._xy >>> 0).toBe(0b0000000000101000_0000000000000000)
  sprite.x = -1
  expect(sprite.x).toBe(-1)
  expect(sprite._xy >>> 0).toBe(0b1111111111111000_0000000000000000)
  sprite.x = -2
  expect(sprite.x).toBe(-2)
  expect(sprite._xy >>> 0).toBe(0b1111111111110000_0000000000000000)

  expect(sprite.y).toBe(0)
  sprite.y = 1
  expect(sprite.y).toBe(1)
  sprite.y = -1
  expect(sprite.y).toBe(-1)
  expect(sprite._xy >>> 0).toBe(0b1111111111110000_1111111111111000)

  for (let x = -4096; x <= 4095; x += 0.125) {
    sprite.x = x
    expect(sprite.x).toBe(x)
  }
  for (let y = -4096; y <= 4095; y += 0.125) {
    sprite.y = y
    expect(sprite.y).toBe(y)
  }
})

test('hits', () => {
  const anim: Anim = {
    cels: 1,
    id: 0x7ff0,
    w: 3,
    h: 4,
    hitbox: {x: 0, y: 0, w: 2, h: 2},
    hurtbox: {x: 0, y: 0, w: 2, h: 2},
    offset: {
      '00': {x: 0, y: 0},
      '01': {x: 0, y: 0},
      10: {x: 0, y: 0},
      11: {x: 0, y: 0},
    },
    tag: 'file--Tag',
  }
  const sprite = new Sprite({anim: {'file--Tag': anim}, cels: []}, 'file--Tag')
  sprite.x = 10
  sprite.y = 100

  expect(sprite.hits({x: 11, y: 101})).toBe(true)
  expect(sprite.hits({x: 15, y: 101})).toBe(false)

  expect(sprite.hits({x: 11, y: 101, w: 1, h: 1})).toBe(true)
  expect(sprite.hits({x: 15, y: 101, w: 1, h: 1})).toBe(false)

  const other = new Sprite({anim: {'file--Tag': anim}, cels: []}, 'file--Tag')
  other.x = 11
  other.y = 101
  expect(sprite.hits(other)).toBe(true)
  expect(other.hits(sprite)).toBe(true)
  other.x = 15
  expect(sprite.hits(other)).toBe(false)
  expect(other.hits(sprite)).toBe(false)
})
