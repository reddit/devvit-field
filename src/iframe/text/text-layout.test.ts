import {describe, expect, test} from 'vitest'
import type {Font} from './font.js'
import memProp5x6 from './mem-prop-5x6.json' with {type: 'json'}
import {layoutText, layoutWord} from './text-layout.js'

const font: Font = memProp5x6
const maxWidth = 8191
describe('layoutText()', () => {
  for (const [i, [string, width, expected]] of (
    [
      ['', maxWidth, {chars: [], cursor: {x: 0, y: 0 * font.lineHeight}}],
      [
        ' ',
        maxWidth,
        {chars: [undefined], cursor: {x: 4, y: 0 * font.lineHeight}},
      ],
      [
        '\n',
        maxWidth,
        {chars: [undefined], cursor: {x: 0, y: 1 * font.lineHeight}},
      ],
      [
        'abc def ghi jkl mno',
        maxWidth,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 13, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 17, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 21, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 26, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 30, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 34, y: 0 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 37, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 41, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 45, y: 0 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 48, y: 0 * font.lineHeight, w: 5, h: font.cellHeight},
            {x: 54, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 58, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 61, y: 0 * font.lineHeight},
        },
      ],
      [
        'abc def ghi jkl mno',
        10,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 2 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 3 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 0, y: 4 * font.lineHeight, w: 5, h: font.cellHeight},
            {x: 6, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 5 * font.lineHeight},
        },
      ],
      [
        'abc def ghi jkl mno',
        20,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 2 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 11, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 15, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 19, y: 2 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 0, y: 3 * font.lineHeight, w: 5, h: font.cellHeight},
            {x: 6, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 10, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 13, y: 3 * font.lineHeight},
        },
      ],
      [
        'abc def ghi jkl mno',
        21,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            {x: 13, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 17, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 21, y: 1 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 2 * font.lineHeight, w: 1, h: font.cellHeight},
            undefined,
            {x: 0, y: 3 * font.lineHeight, w: 5, h: font.cellHeight},
            {x: 6, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 10, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 13, y: 3 * font.lineHeight},
        },
      ],
      [
        'a  b',
        4,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            undefined,
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 2 * font.lineHeight},
        },
      ],
      [
        'a  b ',
        4,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
            undefined,
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            undefined,
          ],
          cursor: {x: 0, y: 3 * font.lineHeight},
        },
      ],
    ] as const
  ).entries()) {
    test(`Case ${i}: string="${string}" width=${width}.`, () =>
      expect(layoutText(font, string, width)).toStrictEqual(expected))
  }
})

describe('layoutWord()', () => {
  for (const [i, [xy, width, string, index, expected]] of (
    [
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        ' ',
        0,
        {chars: [], cursor: {x: 0, y: 0 * font.lineHeight}},
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        '',
        0,
        {chars: [], cursor: {x: 0, y: 0 * font.lineHeight}},
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        '\n',
        0,
        {chars: [], cursor: {x: 0, y: 0 * font.lineHeight}},
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'a',
        0,
        {
          chars: [{x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight}],
          cursor: {x: 3, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        '.',
        0,
        {
          chars: [{x: 0, y: 0 * font.lineHeight, w: 1, h: font.cellHeight}],
          cursor: {x: 1, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'a ',
        0,
        {
          chars: [{x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight}],
          cursor: {x: 2, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'a\n',
        0,
        {
          chars: [{x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight}],
          cursor: {x: 2, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'a a',
        0,
        {
          chars: [{x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight}],
          cursor: {x: 2, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'a.',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 1, h: font.cellHeight},
          ],
          cursor: {x: 5, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'aa',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 7, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'aa\n',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 6, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'aa aa',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 6, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'g',
        0,
        {
          chars: [{x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight}],
          cursor: {x: 3, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 12, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 16, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 20, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 24, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 28, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 31, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'abcdefgh',
        1,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 12, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 16, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 20, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 24, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 27, y: 0 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        maxWidth,
        'abcdefgh',
        8,
        {chars: [], cursor: {x: 0, y: 0 * font.lineHeight}},
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        0,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 7 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 7 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        1,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 7 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 7 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        3,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 7 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 7 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        5,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 7 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 7 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        6,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 7 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 7 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        7,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 7, y: 6 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        8,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 7, y: 3 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        9,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 7, y: 3 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        10,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 7, y: 3 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        11,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 7, y: 3 * font.lineHeight},
        },
      ],
      [
        {x: 0, y: 0 * font.lineHeight},
        12,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 8, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 4, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 7, y: 2 * font.lineHeight},
        },
      ],
      [
        {x: 1, y: 0 * font.lineHeight},
        5,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 1, y: 0 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 7 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 7 * font.lineHeight},
        },
      ],
      [
        {x: 2, y: 0 * font.lineHeight},
        5,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 7 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 8 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 8 * font.lineHeight},
        },
      ],
      [
        {x: 2, y: 1 + 0 * font.lineHeight},
        5,
        'abcdefgh',
        0,
        {
          chars: [
            {x: 0, y: 1 + 1 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 + 2 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 + 3 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 + 4 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 + 5 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 + 6 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 + 7 * font.lineHeight, w: 3, h: font.cellHeight},
            {x: 0, y: 1 + 8 * font.lineHeight, w: 3, h: font.cellHeight},
          ],
          cursor: {x: 3, y: 1 + 8 * font.lineHeight},
        },
      ],
    ] as const
  ).entries()) {
    test(`case ${i}: xy=(${xy.x}, ${xy.y}), width=${width}, string="${string}", index=${index}.`, () =>
      expect(layoutWord(font, xy, width, string, index)).toStrictEqual(
        expected,
      ))
  }
})
