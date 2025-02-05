import type {Box, XY} from '../../shared/types/2d.js'
import {type Font, fontCharWidth, fontKerning} from './font.js'

export type TextLayout = {
  /** the length of this array matches the string length. */
  readonly chars: (Readonly<Box> | undefined)[]
  /** the offset in pixels. to-do: should this be passed in? */
  readonly cursor: Readonly<XY>
}

export function layoutText(font: Font, str: string, maxW: number): TextLayout {
  const chars = []
  let cursor = {x: 0, y: 0}
  while (chars.length < str.length) {
    const i = chars.length
    const char = str[i]!
    let layout: TextLayout
    if (char === '\n') layout = layoutNewline(font, cursor)
    else if (/^\s*$/.test(char)) {
      layout = layoutSpace(font, cursor, maxW, tracking(font, char, str[i + 1]))
    } else {
      layout = layoutWord(font, cursor, maxW, str, i)
      if (cursor.x > 0 && layout.cursor.y === nextLine(font, cursor.y).y) {
        const wordW = maxW - cursor.x + layout.cursor.x
        if (wordW <= maxW) {
          // word can fit on one line if cursor is reset to the start of line.
          cursor = nextLine(font, cursor.y)
          layout = layoutWord(font, cursor, maxW, str, i)
        }
      }
    }
    chars.push(...layout.chars)
    cursor.x = layout.cursor.x
    cursor.y = layout.cursor.y
  }
  return {chars, cursor}
}

/** @internal */
export function layoutWord(
  font: Font,
  cursor: Readonly<XY>,
  maxW: number,
  word: string,
  index: number,
): TextLayout {
  const chars = []
  let {x, y} = cursor
  for (;;) {
    const char = word[index]
    if (!char || /^\s*$/.test(char)) break

    const span = tracking(font, char, word[index + 1])
    if (x > 0 && x + span > maxW) ({x, y} = nextLine(font, y))

    // width is not span since, with kerning, that may exceed the actual
    // width of the character's sprite. eg, if w has the maximal character width
    // of five pixels and a one pixel kerning for a given pair of characters, it
    // will have a span of six pixels which is greater than the maximal five
    // pixel sprite that can be rendered.
    chars.push({x, y, w: fontCharWidth(font, char), h: font.cellHeight})
    x += span

    index++
  }
  return {chars, cursor: {x, y}}
}

function nextLine(font: Font, y: number): XY {
  return {x: 0, y: y + font.lineHeight}
}

function layoutNewline(font: Font, cursor: Readonly<XY>): TextLayout {
  return {chars: [undefined], cursor: nextLine(font, cursor.y)}
}

/**
 * @arg span  the distance in pixels from the start of the current character to
 *            the start of the next including scale.
 */
function layoutSpace(
  font: Font,
  cursor: Readonly<XY>,
  width: number,
  span: number,
): TextLayout {
  const nextCursor =
    cursor.x > 0 && cursor.x + span >= width
      ? nextLine(font, cursor.y)
      : {x: cursor.x + span, y: cursor.y}
  return {chars: [undefined], cursor: nextCursor}
}

/** @return the distance in pixels from the start of lhs to the start of rhs. */
function tracking(font: Font, lhs: string, rhs: string | undefined): number {
  return fontCharWidth(font, lhs) + fontKerning(font, lhs, rhs)
}
