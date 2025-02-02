import {type Box, type WH, type XY, boxHits} from '../shared/types/2d.ts'

/** Position relative the camera's bounding box. */
export type FollowCamOrientation =
  | 'North'
  | 'Northeast'
  | 'East'
  | 'Southeast'
  | 'South'
  | 'Southwest'
  | 'West'
  | 'Northwest'
  | 'Center'

export class Cam {
  minWH: WH = {w: 256, h: 256} // Ints when intScale.
  minScale: number = 1 // Int when intScale.

  readonly #clientWH: WH = {w: 1, h: 1} // Fraction.
  #h: number = this.minWH.h // Int when intScale.
  #scale: number = 1 // Int when intScale.
  #w: number = this.minWH.w // Int when intScale.
  x: number = 0 // Fraction.
  y: number = 0 // Fraction.
  intScale: boolean = false

  /** Integral height. */
  get h(): number {
    return this.#h
  }

  isVisible(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
  }

  lead(
    wh: Readonly<WH>,
    orientation: FollowCamOrientation,
    opts?: {
      readonly fill?: 'X' | 'Y' | 'XY'
      readonly modulo?: Partial<Readonly<XY>> | undefined
      readonly pad?: Partial<Readonly<WH>> | undefined
    },
  ): Box {
    const padW = opts?.pad?.w ?? 0
    let x = this.x
    switch (orientation) {
      case 'Southwest':
      case 'West':
      case 'Northwest':
        x += padW
        break
      case 'Southeast':
      case 'East':
      case 'Northeast':
        x += this.w - (wh.w + padW)
        break
      case 'North':
      case 'South':
      case 'Center':
        x += Math.trunc(this.w / 2) - Math.trunc(wh.w / 2)
        break
    }
    x -= x % ((opts?.modulo?.x ?? x) || 1)

    const padH = opts?.pad?.h ?? 0
    let y = this.y
    switch (orientation) {
      case 'North':
      case 'Northeast':
      case 'Northwest':
        y += padH
        break
      case 'Southeast':
      case 'South':
      case 'Southwest':
        y += this.h - (wh.h + padH)
        break
      case 'East':
      case 'West':
      case 'Center':
        y += Math.trunc(this.h / 2) - Math.trunc(wh.h / 2)
        break
    }
    y -= y % ((opts?.modulo?.y ?? y) || 1)

    const w =
      opts?.fill === 'X' || opts?.fill === 'XY' ? this.w - 2 * padW : wh.w
    const h =
      opts?.fill === 'Y' || opts?.fill === 'XY' ? this.h - 2 * padH : wh.h

    return {x, y, w, h}
  }

  get portrait(): boolean {
    return this.h > this.w
  }

  /** Fill or just barely exceed the viewport in scaled pixels. */
  resize(zoomOut?: number): void {
    // WH of body in CSS px; document.body.getBoundingClientRect() returns
    // incorrectly large sizing on mobile that includes the address bar.
    this.#clientWH.w = innerWidth
    this.#clientWH.h = innerHeight

    this.#scale = camScale(this.minWH, this.minScale, zoomOut, this.intScale)
    if (this.intScale) this.#scale = Math.trunc(this.#scale)
    const native = camNativeWH()
    this.#w = Math.ceil(native.w / this.#scale)
    this.#h = Math.ceil(native.h / this.#scale)
  }

  /** Integral scale. */
  get scale(): number {
    return this.#scale
  }

  /** Returns position in fractional level coordinates. */
  toLevelXY(clientXY: Readonly<XY>): XY {
    return {
      x: this.x + (clientXY.x / this.#clientWH.w) * this.#w,
      y: this.y + (clientXY.y / this.#clientWH.h) * this.#h,
    }
  }

  /** Integral width. */
  get w(): number {
    return this.#w
  }
}

export function camScale(
  minWH: Readonly<WH>,
  minScale: number,
  zoomOut: number | undefined,
  int: boolean,
): number {
  const native = camNativeWH()
  let scale = Math.max(
    minScale,
    // Default is to zoom in as much as possible.
    Math.min(native.w / minWH.w, native.h / minWH.h) - (zoomOut ?? 0),
  )
  if (int) scale = Math.trunc(scale)
  return scale
}

export function camNativeWH(): WH {
  return {
    w: Math.ceil(innerWidth * devicePixelRatio), // physical.
    h: Math.ceil(innerHeight * devicePixelRatio),
  }
}
