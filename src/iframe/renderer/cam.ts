import {
  type Box,
  type WH,
  type XY,
  boxHits,
  xyAdd,
} from '../../shared/types/2d.ts'

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

// It'd probably be better to use an exponential here but this was easier at the
// cost of index state.
// to-do: subpixel coordinates are truncating.
const fieldScaleLvls: readonly number[] = [
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 54, 58, 62, 66, 70, 74, 78,
  82, 86, 90, 98, 106, 114, 122, 130, 138, 146, 154, 162, 170, 178, 186, 194,
  202, 210, 218, 226, 234, 242, 250,
]
const minUserFieldScaleLvl: number = fieldScaleLvls.indexOf(40)!
const defaultFieldScaleLvl: number = fieldScaleLvls.indexOf(98)!

export class Cam {
  /** Fractional (but only integral is ever honored). */
  minWH: WH = {w: 256, h: 256}
  /** Integral. */
  h: number = this.minWH.h
  /** Integral. */
  w: number = this.minWH.w
  mode: 'Int' | 'Fraction' = 'Fraction' // to-do: invalidate?
  minScale: number = 1 // Int when intScale. to-do: invalidate?
  prev: {x: number; y: number; w: number; h: number; scale: number}
  /** Integral scale when mode is int. */
  scale: number = 1
  /** Fractional. */
  x: number = 0
  /** Fractional. */
  y: number = 0
  #fieldScaleLvl: number = defaultFieldScaleLvl

  constructor() {
    this.prev = {x: this.x, y: this.y, w: this.w, h: this.h, scale: this.scale}
  }

  get fieldScale(): number {
    return fieldScaleLvls[this.#fieldScaleLvl]!
  }

  get fieldScaleLevel(): number {
    return this.#fieldScaleLvl
  }

  isVisible(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
  }

  lead(
    wh: Readonly<WH>,
    orientation: FollowCamOrientation,
    opts?: {
      readonly fill?: 'X' | 'Y' | 'XY' | undefined
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
  resize(canvas: HTMLCanvasElement, zoomOut?: number): void {
    this.prev = {x: this.x, y: this.y, w: this.w, h: this.h, scale: this.scale}
    this.scale = camScale(canvas, this.minWH, this.minScale, zoomOut, this.mode)

    const native = camNativeWH(canvas)
    this.w = Math.ceil(native.w / this.scale)
    this.h = Math.ceil(native.h / this.scale)
  }

  /** Independent zoom for the field (doesn't impact UI). */
  setFieldScaleLevel(lvl: number, pt: Readonly<XY>, superuser: boolean): void {
    const index = Math.max(
      superuser ? 0 : minUserFieldScaleLvl,
      Math.min(fieldScaleLvls.length - 1, lvl),
    )
    if (this.#fieldScaleLvl === index) return

    const prev = this.fieldScale
    this.#fieldScaleLvl = index

    this.x += pt.x / prev - pt.x / this.fieldScale
    this.y += pt.y / prev - pt.y / this.fieldScale
  }

  /** Returns position in fractional level coordinates. */
  toLevelXY(canvas: HTMLCanvasElement, clientXY: Readonly<XY>): XY {
    return xyAdd(this, this.toScreenXY(canvas, clientXY))
  }

  /** Scaled camera pixels but relative the top-left of the viewport. */
  toScreenXY(canvas: HTMLCanvasElement, clientXY: Readonly<XY>): XY {
    const wh = parentWH(canvas)
    return {
      x: (clientXY.x / wh.w) * this.w,
      y: (clientXY.y / wh.h) * this.h,
    }
  }

  get valid(): boolean {
    return (
      this.scale === this.prev.scale &&
      this.x === this.prev.x &&
      this.y === this.prev.y &&
      this.w === this.prev.w &&
      this.h === this.prev.h
    )
  }
}

export function camScale(
  canvas: HTMLCanvasElement,
  minWH: Readonly<WH>,
  minScale: number,
  zoomOut: number | undefined,
  mode: 'Int' | 'Fraction',
): number {
  const native = camNativeWH(canvas)
  let scale = Math.max(
    minScale,
    // Default is to zoom in as much as possible.
    Math.min(native.w / minWH.w, native.h / minWH.h) - (zoomOut ?? 0),
  )
  // If it's within .05 of an integer, use the integer.
  scale = Math.round(scale) - scale < 0.05 ? Math.round(scale) : scale
  return mode === 'Int' ? Math.trunc(scale) : scale
}

/** Returns dimensions in physical pixels. */
export function camNativeWH(canvas: HTMLCanvasElement): WH {
  const wh = parentWH(canvas)
  return {
    w: Math.ceil(wh.w * devicePixelRatio),
    h: Math.ceil(wh.h * devicePixelRatio),
  }
}

function parentWH(canvas: HTMLCanvasElement): WH {
  // WH of body in CSS px; document.body.getBoundingClientRect() returns
  // incorrectly large sizing on mobile that includes the address bar. Less
  // any border with border-box.
  return {
    w: canvas.parentElement!.clientWidth,
    h: canvas.parentElement!.clientHeight,
  }
}
