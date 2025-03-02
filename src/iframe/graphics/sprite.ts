import {type Box, type WH, type XY, boxHits} from '../../shared/types/2d.js'
import type {Game} from '../game/game.js'
import type {Anim, AnimOffset, Atlas, TagFormat} from './atlas.js'
import type {Bmp} from './bmp.js'

export type SpriteJSON = {
  cel?: number
  flip?: string
  tag: string
  x?: number
  y?: number
  z?: number
  w?: number
  h?: number
  zend?: boolean
}

// to-do: can this be a utility that operates on an array + index? Pushing quads
//        seems to fit well with ents being the most important objects that
//        manage their own drawing. Would like to extend to 53 bits for scaling
//        and additional features.
export class Sprite<T> implements Bmp, Box {
  static parse<T>(atlas: Atlas<T>, json: Readonly<SpriteJSON>): Sprite<T> {
    if (!(json.tag in atlas.anim)) throw Error(`no sprite tag "${json.tag}"`)
    // to-do: add validation logic.
    // if (
    //   json.flip != null &&
    //   json.flip !== 'X' &&
    //   json.flip !== 'Y' &&
    //   json.flip !== 'XY'
    // )
    //   throw Error(`invalid sprite flip "${json.flip}"`)
    const sprite = new Sprite(atlas, <T & TagFormat>json.tag)
    sprite.cel = json.cel ?? 0
    sprite.flipX = json.flip === 'X' || json.flip === 'XY'
    sprite.flipY = json.flip === 'Y' || json.flip === 'XY'
    sprite.x = json.x ?? 0
    sprite.y = json.y ?? 0
    sprite.z = json.z ?? 0
    sprite.zend = json.zend ?? false
    if (json.w != null) sprite.w = json.w
    if (json.h != null) sprite.h = json.h
    return sprite
  }

  _isffzz: number = 0
  _x: number = 0
  _y: number = 0
  _wh: number = 0

  // to-do: do i need this? it's readonly?
  #anim: Anim<T> = <Anim<T>>{
    offset: {
      '00': {x: 0, y: 0},
      '01': {x: 0, y: 0},
      10: {x: 0, y: 0},
      11: {x: 0, y: 0},
    },
  } // Init'd by tag.
  readonly #atlasAnim: Atlas<T>['anim']

  constructor(atlas: Atlas<T>, tag: T & TagFormat) {
    this.#atlasAnim = atlas.anim
    this.tag = tag // Inits #anim, w, h.
  }

  above(sprite: Readonly<Sprite<T>>): boolean {
    const compare =
      this.z === sprite.z
        ? (sprite.zend ? sprite.y + sprite.h : sprite.y) -
          (this.zend ? this.y + this.h : this.y)
        : this.z - sprite.z
    return compare < 0
  }

  get cel(): number {
    return (this._isffzz >>> 7) & 0xf
  }

  /** Set to Looper.frame / 4 to start at the beginning. */
  set cel(cel: number) {
    this._isffzz = (this._isffzz & 0xfffff87f) | ((cel & 0xf) << 7)
  }

  /** The number of cels in the original animation (no wrapping). */
  get cels(): number {
    return this.#anim.cels
  }

  /** test if either bitmap overlaps box or sprite (bitmap). */
  clips(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
  }

  get flipX(): boolean {
    return !!(this._isffzz & 0x20)
  }

  set flipX(flip: boolean) {
    if (this.flipX === flip) return
    const old =
      this.#anim.offset[
        `${Number(this.flipX)}${Number(this.flipY)}` as keyof AnimOffset
      ]
    const offset =
      this.#anim.offset[
        `${Number(flip)}${Number(this.flipY)}` as keyof AnimOffset
      ]
    this.x += -old.x + offset.x
    this.y += -old.y + offset.y
    this._isffzz = flip ? this._isffzz | 0x20 : this._isffzz & 0xffffffdf
  }

  get flipY(): boolean {
    return !!(this._isffzz & 0x10)
  }

  set flipY(flip: boolean) {
    if (this.flipY === flip) return
    const old =
      this.#anim.offset[
        `${Number(this.flipX)}${Number(this.flipY)}` as keyof AnimOffset
      ]
    const offset =
      this.#anim.offset[
        `${Number(this.flipX)}${Number(flip)}` as keyof AnimOffset
      ]
    this.x += -old.x + offset.x
    this.y += -old.y + offset.y
    this._isffzz = flip ? this._isffzz | 0x10 : this._isffzz & 0xffffffef
  }

  get h(): number {
    return this._wh & 0xfff
  }

  set h(h: number) {
    this._wh = (this._wh & 0xfffff000) | (h & 0xfff)
  }

  get hitbox(): Box | undefined {
    const {hitbox} = this.#anim
    if (!hitbox) return undefined
    return {
      x: this.x + (this.flipX ? hitbox.w - hitbox.x : hitbox.x),
      y: this.y + (this.flipY ? hitbox.h - hitbox.y : hitbox.y),
      w: hitbox.w,
      h: hitbox.h,
    }
  }

  hits(box: Readonly<XY & Partial<WH>>): boolean {
    if (!this.#anim.hitbox || (box instanceof Sprite && !box.#anim.hurtbox))
      return false
    if (!this.clips(box)) return false
    return boxHits(this.hitbox!, box instanceof Sprite ? box.hurtbox! : box)
  }

  get hurtbox(): Box | undefined {
    const {hurtbox} = this.#anim
    if (!hurtbox) return undefined
    return {
      x: this.x + (this.flipX ? hurtbox.w - hurtbox.x : hurtbox.x),
      y: this.y + (this.flipY ? hurtbox.h - hurtbox.y : hurtbox.y),
      w: hurtbox.w,
      h: hurtbox.h,
    }
  }

  // to-do: is this any better than doing CPI side for finite animations if it
  //        must be checked every frame?
  // to-do: this is truncating by 1/60th of the last frame.
  /** True if the animation has played. Resets on second loop. */
  isLooped(game: Readonly<Game>): boolean {
    return ((game.looper.frame - this.cel * 4) & 0x3f) >= 4 * this.cels - 1
  }

  get stretch(): boolean {
    return !!(this._isffzz & 0x40)
  }

  /** Scale to width and height. */
  set stretch(scale: boolean) {
    if (scale) this._isffzz |= 0x40
    else this._isffzz &= 0xffffffbf
  }

  get tag(): T {
    return this.#anim.tag
  }

  /** Sets animation, hitbox, and hurtbox. */
  set tag(tag: T & TagFormat) {
    if (tag === this.#anim.tag) return
    const key = `${Number(this.flipX)}${Number(this.flipY)}` as keyof AnimOffset
    const old = this.#anim.offset[key]
    this.#anim = this.#atlasAnim[tag]
    // if (devMode && !this.#anim) throw Error(`no sprite tag "${tag}"`)
    const offset = this.#anim.offset[key]
    this.x += -old.x + offset.x
    this.y += -old.y + offset.y
    this.w = this.#anim.w
    this.h = this.#anim.h
    this._isffzz = (this._isffzz & 0xfffc0007f) | (this.#anim.id << 7)
  }

  toString(): string {
    return `${this.tag} (${this.x}, ${this.y}) ${this.w}×${this.h}`
  }

  get w(): number {
    return (this._wh >>> 12) & 0xfff
  }

  set w(w: number) {
    this._wh = (this._wh & 0xff000fff) | ((w & 0xfff) << 12)
  }

  get x(): number {
    return (this._x >> 0) / 8
  }

  set x(x: number) {
    if (x === this.x) return
    this._x = (this._x & 0x00000000) | (((8 * x) & 0xffffffff) << 0)
  }

  set xy(xy: Readonly<XY>) {
    this.x = xy.x
    this.y = xy.y
  }

  get y(): number {
    return ((this._y << 0) >> 0) / 8
  }

  set y(y: number) {
    if (y === this.y) return
    this._y = (this._y & 0x00000000) | ((8 * y) & 0xffffffff)
  }

  get z(): number {
    return this._isffzz & 0x7
  }

  /** Greater is further. Warning: the default is 0 (closest). */
  set z(z: number) {
    this._isffzz = (this._isffzz & 0xfffffff8) | (z & 0x7)
  }

  get zend(): boolean {
    return !!(this._isffzz & 0x8)
  }

  /** Z-order by top (default) or bottom of rectangle. */
  set zend(end: boolean) {
    if (end) this._isffzz |= 0x8
    else this._isffzz &= 0xfffffff7
  }
}
