import {type XY, type XYZ, xyDistance, xySub} from '../../shared/types/2d.ts'
import type {Cam} from '../renderer/cam.ts'

export type PointType =
  (typeof pointTypeByPointerType)[keyof typeof pointTypeByPointerType]

type Point = {
  bits: number
  clientXY: XY
  id: number
  /**
   * Cursors should only use the primary inputs to avoid flickering between
   * distant points. Inputs may all be secondaries.
   */
  primary: boolean
  screenXY: XY
  type: PointType | undefined
  /** Level coordinates of pointer recorded with the camera at capture time. */
  xy: XY
}

const pointTypeByPointerType = {
  mouse: 'Mouse',
  pen: 'Pen',
  touch: 'Touch',
} as const

export class PointerPoller {
  allowContextMenu: boolean = false // Suppress right-click.
  readonly bitByButton: {[btn: number]: number} = {}
  delta: XY = {x: 0, y: 0}
  /** The potential start of a drag. */
  readonly dragClientStart: XY = {x: 0, y: 0}
  readonly #cam: Readonly<Cam>
  readonly #canvas: HTMLCanvasElement
  readonly #primary: {cur: Point; next: Point} = {cur: Point(), next: Point()}
  readonly #secondary: {cur: Point; next: Point} = {cur: Point(), next: Point()}
  /**
   * Hack: every loop poll is called first. Drag is wanted to start on time but
   * finish one loop late so that off starts one loop ahead.
   */
  #drag: number = 0
  #on: number = 0
  readonly #wheel: {cur: XYZ; next: XYZ} = {
    cur: {x: 0, y: 0, z: 0},
    next: {x: 0, y: 0, z: 0},
  }

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#cam = cam
    this.#canvas = canvas
  }

  get bits(): number {
    return this.#primary.cur.bits
  }

  get clientXY(): XY {
    return this.#primary.cur.clientXY
  }

  get drag(): boolean {
    return (this.#drag & 7) !== 0
  }

  // to-do: clarify this is for including movement and align with Input.gestured.
  get on(): boolean {
    return (this.#on & 3) !== 0
  }

  poll(): void {
    this.#drag = (this.#drag & 4) | ((this.#drag & 7) >>> 1)
    // to-do: it's inconsistent to be left-shifting here and right-shifting
    //        above.
    this.#on <<= 1
    const delta = xySub(this.#primary.next.clientXY, this.#primary.cur.clientXY)
    this.delta = {x: delta.x / this.#cam.scale, y: delta.y / this.#cam.scale}
    this.#primary.cur = structuredClone(this.#primary.next)
    this.#wheel.cur = this.#wheel.next
    this.#wheel.next = {x: 0, y: 0, z: 0}
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    this.#canvas[fn]('pointercancel', this.reset, {
      capture: true,
      passive: true,
    })
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
      this.#canvas[fn](type, this.#onPointEvent as EventListener, {
        capture: true,
        passive: type !== 'pointerdown',
      })
    }
    // to-do: should be part of pointer? If so, why bother separating key poll?
    this.#canvas[fn]('wheel', this.#onWheel as EventListener, {
      capture: true,
      passive: true,
    })
    this.#canvas[fn]('contextmenu', this.#onContextMenuEvent, {capture: true})
  }

  reset = (): void => {
    this.#primary.next.bits = 0
    this.delta = {x: 0, y: 0}
    this.#drag = 0
    this.#on = 0
    this.#primary.next.type = undefined
    this.#wheel.next = {x: 0, y: 0, z: 0}
  }

  get screenXY(): XY {
    return this.#primary.cur.screenXY
  }

  get type(): PointType | undefined {
    return this.#primary.cur.type
  }

  /** Wheel delta. */
  get wheel(): XYZ {
    return this.#wheel.cur
  }

  get xy(): XY {
    return this.#primary.cur.xy
  }

  #onContextMenuEvent = (ev: Event): void => {
    if (!ev.isTrusted) return
    if (!this.allowContextMenu) ev.preventDefault()
  }

  #onPointEvent = (ev: PointerEvent): void => {
    if (!ev.isTrusted) return

    // to-do: record event here and move processing to poll() which happens
    //        before reading. It's hard to make sense out of band here.

    const point = ev.isPrimary ? this.#primary.next : this.#secondary.next

    point.bits = this.#evButtonsToBits(ev.buttons)
    point.type =
      pointTypeByPointerType[
        ev.pointerType as keyof typeof pointTypeByPointerType
      ]
    ;({clientX: point.clientXY.x, clientY: point.clientXY.y} = ev)
    point.screenXY = this.#cam.toScreenXY(this.#canvas, point.clientXY)
    point.xy = this.#cam.toLevelXY(this.#canvas, point.clientXY)

    if (ev.isPrimary)
      if (ev.type === 'pointerdown') {
        this.#canvas.setPointerCapture(ev.pointerId)
        if (ev.isPrimary) {
          this.dragClientStart.x = point.clientXY.x
          this.dragClientStart.y = point.clientXY.y
        }
        ev.preventDefault() // Not passive.
      }
    if (ev.isPrimary) {
      this.#on |= 1
      this.#drag =
        (this.#drag & 3) |
        (!!point.bits &&
        (this.#drag & 4 || xyDistance(point.clientXY, this.dragClientStart) > 5)
          ? 4
          : 0)
    }
  }

  #onWheel = (ev: WheelEvent): void => {
    if (!ev.isTrusted) return
    this.#wheel.next.x = ev.shiftKey ? ev.deltaY : ev.deltaX
    this.#wheel.next.y = ev.shiftKey ? ev.deltaX : ev.deltaY
    this.#wheel.next.z = ev.deltaZ
  }

  #evButtonsToBits(buttons: number): number {
    let bits = 0
    for (let button = 1; button <= buttons; button <<= 1) {
      if ((button & buttons) !== button) continue
      bits |= this.bitByButton[button] ?? 0
    }
    return bits
  }
}

function Point(): Point {
  return {
    bits: 0,
    clientXY: {x: 0, y: 0},
    id: 0,
    primary: false,
    screenXY: {x: 0, y: 0},
    type: undefined,
    xy: {x: 0, y: 0},
  }
}
