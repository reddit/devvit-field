/** https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md */

import type {TagFormat} from '../src/iframe/graphics/atlas.js'
import type {Box, WH} from '../src/shared/types/2d.js'

export type Aseprite = {
  readonly meta: AsepriteMeta
  readonly frames: AsepriteFrameMap
}

export type AsepriteFrameMap = {
  readonly [key: AsepriteFrameTag]: AsepriteFrame
}

export type AsepriteMeta = {
  /** `--list-tags`. */
  readonly frameTags: readonly AsepriteTagSpan[]
  readonly size: Readonly<WH>
  /** `--list-slices`. */
  readonly slices: readonly AsepriteSlice[]
}

/** `--filename-format='{title}--{tag}--{frame}'`. */
export type AsepriteFrameTag = `${TagFormat}--${bigint}`

export type AsepriteFrame = {
  /** Bounds including padding. */
  readonly frame: Readonly<Box>
  /** WH without padding. */
  readonly sourceSize: Readonly<WH>
}

export type AsepriteTagSpan = {
  readonly name: TagFormat | string
  readonly from: number
  /** The inclusive ending index, possibly equal to from. */
  readonly to: number
}

export type AsepriteSlice = {
  /** '#ff0000ff' is hitbox, '#00ff00ff' is hurtbox, '#0000ffff is both. */
  readonly color: string
  readonly name: TagFormat | string
  readonly keys: readonly {readonly bounds: Readonly<Box>}[]
}
