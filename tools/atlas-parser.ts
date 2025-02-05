import type {Anim, Atlas, TagFormat} from '../src/iframe/graphics/atlas.js'
import type {AnimOffsetConfig} from '../src/iframe/types/config.js'
import type {Box, XY} from '../src/shared/types/2d.js'
import type {
  Aseprite,
  AsepriteFrame,
  AsepriteFrameMap,
  AsepriteFrameTag,
  AsepriteSlice,
  AsepriteTagSpan,
} from './aseprite.js'

const maxAnimCels: number = 16

export function parseAtlas<T>(
  ase: Aseprite,
  tags: {readonly [tag: string]: AnimOffsetConfig},
): Atlas<T> {
  const anims = new Map()
  const cels = []
  for (const span of ase.meta.frameTags) {
    const tag = parseTag(span.name)
    const offset = tags[tag]
    if (offset == null) throw Error(`unknown tag "${tag}"`)
    if (anims.has(tag)) throw Error(`duplicate tag "${tag}"`)
    const id = anims.size * maxAnimCels
    const anim = parseAnim(id, span, ase.frames, ase.meta.slices, offset)
    anims.set(tag, anim)
    for (const cel of [...parseAnimFrames(span, ase.frames)].map(parseCel))
      cels.push(cel.x, cel.y, anim.w, anim.h)
  }
  for (const tag in tags)
    if (!anims.has(tag)) throw Error(`no animation with tag "${tag}"`)
  for (const slice of ase.meta.slices)
    if (!anims.has(parseTag(slice.name)))
      throw Error(`hitbox "${slice.name}" has no animation`)
  return {anim: Object.fromEntries(anims), cels}
}

/** @internal */
export function parseAnim(
  id: number,
  span: AsepriteTagSpan,
  map: AsepriteFrameMap,
  slices: readonly AsepriteSlice[],
  offset: AnimOffsetConfig,
): Anim<TagFormat> {
  const frame = parseAnimFrames(span, map).next().value
  if (!frame) throw Error('animation missing frames')
  const {hitbox, hurtbox} = parseHitboxes(span, slices)
  return {
    h: frame.sourceSize.h,
    hitbox,
    hurtbox,
    id,
    offset: {
      '00': {x: offset['00']?.x ?? 0, y: offset?.['00']?.y ?? 0},
      '01': {x: offset['01']?.x ?? 0, y: offset?.['01']?.y ?? 0},
      10: {x: offset['10']?.x ?? 0, y: offset?.['10']?.y ?? 0},
      11: {x: offset['11']?.x ?? 0, y: offset?.['11']?.y ?? 0},
    },
    tag: parseTag(span.name),
    w: frame.sourceSize.w,
  }
}

function* parseAnimFrames(
  span: AsepriteTagSpan,
  map: AsepriteFrameMap,
): IterableIterator<AsepriteFrame> {
  for (let i = span.from; i <= span.to && i - span.from < maxAnimCels; i++) {
    const frameTag = `${span.name}--${i}` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no frame "${frameTag}"`)
    yield frame
  }
  // Pad remaining.
  for (let i = span.to + 1; i < span.from + maxAnimCels; i++) {
    const frameTag =
      `${span.name}--${span.from + (i % (span.to + 1 - span.from))}` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no frame "${frameTag}"`)
    yield frame
  }
}

export function parseCel(frame: AsepriteFrame): Readonly<XY> {
  return {
    x: frame.frame.x + (frame.frame.w - frame.sourceSize.w) / 2,
    y: frame.frame.y + (frame.frame.h - frame.sourceSize.h) / 2,
  }
}

/** @internal */
export function parseHitboxes(
  span: AsepriteTagSpan,
  slices: readonly AsepriteSlice[],
): {
  readonly hitbox: Readonly<Box> | undefined
  hurtbox: Readonly<Box> | undefined
} {
  let hitbox
  let hurtbox
  // https://github.com/aseprite/aseprite/issues/3524
  for (const slice of slices) {
    if (slice.name !== span.name) continue

    if (!slice.keys[0]) continue

    for (const key of slice.keys)
      if (
        key.bounds.x !== slice.keys[0].bounds.x ||
        key.bounds.y !== slice.keys[0].bounds.y ||
        key.bounds.w !== slice.keys[0].bounds.w ||
        key.bounds.h !== slice.keys[0].bounds.h
      )
        throw Error(`tag "${span.name}" hitbox bounds varies across frames`)

    const red = slice.color === '#ff0000ff'
    const green = slice.color === '#00ff00ff'
    const blue = slice.color === '#0000ffff'
    if (!red && !green && !blue)
      throw Error(`tag "${span.name}" hitbox color ${slice.color} unsupported`)

    if (hitbox && (red || blue))
      throw Error(`tag "${span.name}" has multiple hitboxes`)

    if (hurtbox && (green || blue))
      throw Error(`tag "${span.name}" has multiple hurtboxes`)

    if (red || blue) hitbox = slice.keys[0].bounds
    if (green || blue) hurtbox = slice.keys[0].bounds
  }
  return {hitbox, hurtbox}
}

function parseTag(tag: string): TagFormat {
  if (!tag.includes('--'))
    throw Error(`tag "${tag}" not in <filestem>--<animation> format`)
  return tag as TagFormat
}
