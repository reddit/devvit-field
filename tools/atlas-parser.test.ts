import {describe, expect, test} from 'vitest'
import type {Anim, Atlas} from '../src/iframe/graphics/atlas.js'
import type {AsepriteTagSpan} from './aseprite.ts'
import {parseAnim, parseAtlas, parseCel, parseHitboxes} from './atlas-parser.ts'

describe('parseAtlas()', () => {
  test('parses empty', () => {
    expect(
      parseAtlas(
        {
          meta: {frameTags: [], size: {w: 0, h: 0}, slices: []},
          frames: {},
        },
        {},
      ),
    ).toStrictEqual({anim: {}, cels: []})
  })

  test('parses nonempty', () => {
    const frameTags = [
      {name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward'},
      {name: 'palette--red', from: 1, to: 1, direction: 'forward'},
      {name: 'scenery--Conifer', from: 2, to: 2, direction: 'forward'},
      {name: 'scenery--ConiferShadow', from: 3, to: 3, direction: 'forward'},
    ]
    const frames = {
      'scenery--Cloud--0': {
        frame: {x: 220, y: 18, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 1,
      },
      'palette--red--1': {
        frame: {x: 90, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535,
      },
      'scenery--Conifer--2': {
        frame: {x: 72, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535,
      },
      'scenery--ConiferShadow--3': {
        frame: {x: 54, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535,
      },
    }
    const slices = [
      {
        name: 'scenery--Cloud',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 8, y: 12, w: 2, h: 3}}],
      },
      {
        name: 'scenery--Cloud',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 1, y: 2, w: 3, h: 4}}],
      },
      {
        name: 'palette--red',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 11, w: 3, h: 4}}],
      },
      {
        name: 'scenery--Conifer',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 10, w: 3, h: 5}}],
      },
      {
        name: 'scenery--ConiferShadow',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 9, w: 3, h: 6}}],
      },
    ]
    expect(
      parseAtlas(
        {meta: {frameTags, size: {w: 0, h: 0}, slices}, frames},
        {
          'palette--red': {},
          'scenery--Cloud': {},
          'scenery--Conifer': {},
          'scenery--ConiferShadow': {},
        },
      ),
    ).toStrictEqual({
      anim: {
        'scenery--Cloud': {
          cels: 1,
          id: 0x00,
          tag: 'scenery--Cloud',
          w: 16,
          h: 16,
          hitbox: {x: 8, y: 12, w: 2, h: 3},
          hurtbox: {x: 1, y: 2, w: 3, h: 4},
          offset: {
            '00': {x: 0, y: 0},
            '01': {x: 0, y: 0},
            10: {x: 0, y: 0},
            11: {x: 0, y: 0},
          },
        },
        'palette--red': {
          cels: 1,
          id: 0x10,
          tag: 'palette--red',
          w: 16,
          h: 16,
          hitbox: {x: 7, y: 11, w: 3, h: 4},
          hurtbox: undefined,
          offset: {
            '00': {x: 0, y: 0},
            '01': {x: 0, y: 0},
            10: {x: 0, y: 0},
            11: {x: 0, y: 0},
          },
        },
        'scenery--Conifer': {
          cels: 1,
          id: 0x20,
          tag: 'scenery--Conifer',
          w: 16,
          h: 16,
          hitbox: {x: 7, y: 10, w: 3, h: 5},
          hurtbox: undefined,
          offset: {
            '00': {x: 0, y: 0},
            '01': {x: 0, y: 0},
            10: {x: 0, y: 0},
            11: {x: 0, y: 0},
          },
        },
        'scenery--ConiferShadow': {
          cels: 1,
          id: 0x30,
          tag: 'scenery--ConiferShadow',
          w: 16,
          h: 16,
          hitbox: {x: 7, y: 9, w: 3, h: 6},
          hurtbox: undefined,
          offset: {
            '00': {x: 0, y: 0},
            '01': {x: 0, y: 0},
            10: {x: 0, y: 0},
            11: {x: 0, y: 0},
          },
        },
      },
      cels: [
        ...Array(16).fill([221, 19, 16, 16]),
        ...Array(16).fill([91, 55, 16, 16]),
        ...Array(16).fill([73, 55, 16, 16]),
        ...Array(16).fill([55, 55, 16, 16]),
      ].flat(),
    } satisfies Atlas<unknown>)
  })

  test('Throws Error on duplicate FrameTag.', () => {
    const frameTags = [
      {name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward'},
      {name: 'palette--red', from: 1, to: 1, direction: 'forward'},
      {name: 'scenery--Cloud', from: 0, to: 0, direction: 'forward'},
    ]
    const frames = {
      'scenery--Cloud--0': {
        frame: {x: 220, y: 18, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 1,
      },
      'palette--red--1': {
        frame: {x: 90, y: 54, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535,
      },
    }
    expect(() =>
      parseAtlas(
        {meta: {frameTags, size: {w: 0, h: 0}, slices: []}, frames},
        {'palette--red': {}, 'scenery--Cloud': {}},
      ),
    ).toThrow()
  })
})

describe('parseAnim()', async () => {
  test('Parses FrameTag, Frame from Frame[], and Slice.', () => {
    const frameTag: AsepriteTagSpan = {
      name: 'cloud--s',
      from: 1,
      to: 1,
    }
    const frames = {
      'cloud--xs--0': {
        frame: {x: 202, y: 36, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535,
      },
      'cloud--s--1': {
        frame: {x: 184, y: 36, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535,
      },
      'cloud--m--2': {
        frame: {x: 166, y: 36, w: 18, h: 18},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535,
      },
    }
    const slices = [
      {
        name: 'cloud--xs',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 12, w: 7, h: 3}}],
      },
      {
        name: 'cloud--s',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 11, w: 9, h: 4}}],
      },
      {
        name: 'cloud--m',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 3, y: 11, w: 10, h: 4}}],
      },
    ]
    expect(parseAnim(16, frameTag, frames, slices, {})).toStrictEqual({
      cels: 1,
      id: 16,
      w: 16,
      h: 16,
      hitbox: {x: 4, y: 11, w: 9, h: 4},
      hurtbox: undefined,
      offset: {
        '00': {x: 0, y: 0},
        '01': {x: 0, y: 0},
        10: {x: 0, y: 0},
        11: {x: 0, y: 0},
      },
      tag: 'cloud--s',
    } satisfies Anim<unknown>)
  })

  test('throws error when no frame is associated with tag', () => {
    const frameTag: AsepriteTagSpan = {name: 'frog--walk', from: 0, to: 0}
    expect(() => parseAnim(16, frameTag, {}, [], {})).toThrow()
  })
})

describe('parseCel()', async () => {
  test('parses 1:1 texture mapping', () => {
    const frame = {
      frame: {x: 1, y: 2, w: 3, h: 4},
      rotated: false,
      trimmed: false,
      spriteSourceSize: {x: 0, y: 0, w: 3, h: 4},
      sourceSize: {w: 3, h: 4},
      duration: 1,
    }
    expect(parseCel(frame)).toStrictEqual({x: 1, y: 2})
  })

  test('parses texture mapping with padding', () => {
    const frame = {
      frame: {x: 1, y: 2, w: 5, h: 6},
      rotated: false,
      trimmed: false,
      spriteSourceSize: {x: 0, y: 0, w: 3, h: 4},
      sourceSize: {w: 3, h: 4},
      duration: 1,
    }
    expect(parseCel(frame)).toStrictEqual({x: 2, y: 3})
  })
})

describe('parseHitboxes()', async () => {
  test('parses hitbox', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 0}
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
    ]
    expect(parseHitboxes(span, slices)).toStrictEqual({
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: undefined,
    })
  })

  test('parses hurtbox', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 0}
    const slices = [
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
    ]
    expect(parseHitboxes(span, slices)).toStrictEqual({
      hitbox: undefined,
      hurtbox: {x: 0, y: 1, w: 2, h: 3},
    })
  })

  test('parses hitbox and hurtbox (blue)', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 0}
    const slices = [
      {
        name: 'stem--foo',
        color: '#0000ffff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
    ]
    expect(parseHitboxes(span, slices)).toStrictEqual({
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: {x: 0, y: 1, w: 2, h: 3},
    })
  })

  test('parses hitbox and hurtbox', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 0}
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 4, y: 5, w: 6, h: 7}}],
      },
    ]
    expect(parseHitboxes(span, slices)).toStrictEqual({
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: {x: 4, y: 5, w: 6, h: 7},
    })
  })

  test('filters out unrelated tags', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 0}
    const slices = [
      {
        name: 'unrelated--bar',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 5, w: 6, h: 7}}],
      },
    ]
    expect(parseHitboxes(span, slices)).toStrictEqual({
      hitbox: {x: 4, y: 5, w: 6, h: 7},
      hurtbox: undefined,
    })
  })

  test('throws on frame with multiple keys', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 2}
    const slices = [
      {
        name: 'stem--foo',
        color: '0000ffff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 8, y: 9, w: 10, h: 11}},
        ],
      },
    ]
    expect(() => parseHitboxes(span, slices)).toThrow()
  })

  test('defaults to undefined hitbox', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 0}
    expect(parseHitboxes(span, [])).toStrictEqual({
      hitbox: undefined,
      hurtbox: undefined,
    })
  })

  test('throws on unsupported color', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 0}
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff00ffff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
    ]
    expect(() => parseHitboxes(span, slices)).toThrow()
  })

  test('throws on multiple hitboxes', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 1}
    const slices = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 12, y: 13, w: 14, h: 15}},
        ],
      },
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
    ]
    expect(() => parseHitboxes(span, slices)).toThrow()
  })

  test('throws on multiple hurtboxes', () => {
    const span: AsepriteTagSpan = {name: 'stem--foo', from: 0, to: 1}
    const slices = [
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 12, y: 13, w: 14, h: 15}},
        ],
      },
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}],
      },
    ]
    expect(() => parseHitboxes(span, slices)).toThrow()
  })
})
