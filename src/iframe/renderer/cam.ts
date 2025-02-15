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
// cost of index state, Integers above 1 and tenths below.
const fieldZoomLevels: readonly number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50,
]
const userMinFieldZoomIndex: number = fieldZoomLevels.indexOf(10)!

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
  #fieldZoomIndex: number = userMinFieldZoomIndex

  constructor() {
    this.prev = {x: this.x, y: this.y, w: this.w, h: this.h, scale: this.scale}
  }

  get fieldScale(): number {
    return fieldZoomLevels[this.#fieldZoomIndex]!
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
    const w = Math.ceil(native.w / this.scale)
    const h = Math.ceil(native.h / this.scale)
    if (w === this.w && h === this.h) return
    this.w = w
    this.h = h
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

  /** Returns position in fractional level coordinates. */
  toLevelXY(canvas: HTMLCanvasElement, clientXY: Readonly<XY>): XY {
    return xyAdd(this, this.toScreenXY(canvas, clientXY))
  }

  toScreenXY(canvas: HTMLCanvasElement, clientXY: Readonly<XY>): XY {
    // WH of body in CSS px; document.body.getBoundingClientRect() returns
    // incorrectly large sizing on mobile that includes the address bar.
    return {
      x: (clientXY.x / canvas.parentElement!.clientWidth) * this.w,
      y: (clientXY.y / canvas.parentElement!.clientHeight) * this.h,
    }
  }

  /** Independent zoom for the field (doesn't impact UI). */
  zoomField(dir: 'In' | 'Out', superuser: boolean): void {
    const index = Math.max(
      superuser ? 0 : userMinFieldZoomIndex,
      Math.min(
        fieldZoomLevels.length - 1,
        this.#fieldZoomIndex + (dir === 'In' ? 1 : -1),
      ),
    )
    if (this.#fieldZoomIndex === index) return

    const prev = this.fieldScale
    this.#fieldZoomIndex = index

    const half = {w: this.w / 2, h: this.h / 2}
    this.x += half.w / prev - half.w / this.fieldScale
    this.y += half.h / prev - half.h / this.fieldScale
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
  const scale = Math.max(
    minScale,
    // Default is to zoom in as much as possible.
    Math.min(native.w / minWH.w, native.h / minWH.h) - (zoomOut ?? 0),
  )
  return mode === 'Int' ? Math.trunc(scale) : scale
}

/** Returns dimensions in physical pixels. */
export function camNativeWH(canvas: HTMLCanvasElement): WH {
  return {
    w: Math.ceil(canvas.parentElement!.clientWidth * devicePixelRatio),
    h: Math.ceil(canvas.parentElement!.clientHeight * devicePixelRatio),
  }
}
