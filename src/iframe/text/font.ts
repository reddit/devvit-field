import type {TagFormat} from '../graphics/atlas.js'

/** Font metrics and detail metadata. */
export type Font = {
  /**
   * PostScript font name less than 63 characters and does not contain any of
   * `(){}[]<>%/ `. Matches the font filename stem. Eg, "mem-mono-3x3".
   */
  readonly id: string

  /** The human readable font name. Eg, "mem mono 3x3". */
  readonly name: string

  /**
   * The maximum width of any character in the font in pixels. Usually present
   * in font name. For example, the max width of "mem prop 5x6" is five pixels.
   */
  readonly cellWidth: number

  /**
   * The maximum height of any character in the font in pixels, including
   * descenders but not leading. Usually present in font name. For example, the
   * max height of "mem prop 5x6" is six pixels. The line height is
   * `cellHeight + leading` or seven pixels.
   */
  readonly cellHeight: number

  /** Distance between lines in pixels. */
  readonly leading: number

  /** `cellHeight + leading`. */
  readonly lineHeight: number

  /**
   * The font's baseline as measured in pixels from the bottom of the cell
   * (`cellHeight`). When nonzero, this is the space available for descenders.
   */
  readonly baseline: number

  /**
   * Variable distance between characters in pixels. The key is two characters
   * and the value may be negative.
   */
  readonly kerning: {readonly [pair: string]: number}

  /**
   * Character-to-character kerning pair widths in pixels. When a pair is not
   * present, `endOfLineKerning` is used when the pair matches the regular
   * expression `.$`, `whitespaceKerning` is used when the pair matches the
   * regular expression `.\s`, otherwise `defaultKerning` is used.
   */
  readonly defaultKerning: number

  /**
   * Kerning for when *either* the left or right character is a space or tab.
   */
  readonly whitespaceKerning: number

  /** Kerning for when the right character is a newline. */
  readonly endOfLineKerning: number

  /**
   * Character width in pixels. When a character is not present,
   * `defaultCharWidth` is used.
   */
  readonly charWidth: {readonly [char: string]: number}

  /**
   * Character width in pixels. When a character is not present in `charWidth`,
   * `defaultCharWidth` is used.
   */
  readonly defaultCharWidth: number
}

export function fontCharToTag(self: Font, char: string): TagFormat {
  let pt = char.codePointAt(0)
  if (pt == null || pt > 0xff) pt = 63 // ?
  return `${self.id}--${pt.toString(16).padStart(2, '0')}`
}

/** @arg rhs undefined means end of line. */
export function fontKerning(
  self: Font,
  lhs: string,
  rhs: string | undefined,
): number {
  if (rhs == null) return self.endOfLineKerning
  if (/^\s*$/.test(lhs) || /^\s*$/.test(rhs)) return self.whitespaceKerning
  return self.kerning[lhs + rhs] ?? self.defaultKerning
}

export function fontCharWidth(self: Font, letter: string): number {
  return self.charWidth[letter] ?? self.defaultCharWidth
}
