import {type XY, type XYZ, xyDistance, xySub} from '../../shared/types/2d.ts'
import type {Cam} from '../renderer/cam.ts'

export class PointerPoller {
  bits: number = 0
  allowContextMenu: boolean = false // Suppress right-click.
  readonly clientXY: XY = {x: 0, y: 0}
  /** The potential start of a drag. */
  readonly dragClientStart: XY = {x: 0, y: 0}
  type: 'mouse' | 'touch' | 'pen' | undefined
  xy: Readonly<XY> = {x: 0, y: 0}
  readonly #bitByButton: {[btn: number]: number} = {}
  readonly #cam: Readonly<Cam>
  readonly #canvas: HTMLCanvasElement
  readonly #delta: [XY, XY] = [
    {x: 0, y: 0},
    {x: 0, y: 0},
  ]
  /**
   * Hack: every loop poll is called first. Drag is wanted to start on time but
   * finish one loop late so that off starts one loop ahead.
   */
  #drag: number = 0
  #on: number = 0
  readonly #wheel: [XYZ, XYZ] = [
    {x: 0, y: 0, z: 0},
    {x: 0, y: 0, z: 0},
  ]

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#cam = cam
    this.#canvas = canvas
  }

  get delta(): XY {
    return this.#delta[0]
  }

  get drag(): boolean {
    return (this.#drag & 7) !== 0
  }

  map(button: number, bit: number): void {
    this.#bitByButton[button] = bit
  }

  // to-do: clarify this is for including movement and align with Input.gestured.
  get on(): boolean {
    return (this.#on & 3) !== 0
  }

  poll(): void {
    this.#delta[0] = this.#delta[1]
    this.#delta[1] = {x: 0, y: 0}
    this.#drag = (this.#drag & 4) | ((this.#drag & 7) >> 1)
    // to-do: it's inconsistent to be left-shifting here and right-shifting
    //        above.
    this.#on <<= 1
    this.#wheel[0] = this.#wheel[1]
    this.#wheel[1] = {x: 0, y: 0, z: 0}
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
    this.bits = 0
    this.#delta[0] = {x: 0, y: 0}
    this.#delta[1] = {x: 0, y: 0}
    this.#drag = 0
    this.#on = 0
    this.type = undefined
    this.#wheel[0] = {x: 0, y: 0, z: 0}
    this.#wheel[1] = {x: 0, y: 0, z: 0}
  }

  get screenXY(): XY {
    return this.#cam.toScreenXY(this.clientXY)
  }

  /** Wheel delta. */
  get wheel(): XYZ {
    return this.#wheel[0]
  }

  #onContextMenuEvent = (ev: Event): void => {
    if (!ev.isTrusted) return
    if (!this.allowContextMenu) ev.preventDefault()
  }

  #onPointEvent = (ev: PointerEvent): void => {
    if (!ev.isTrusted) return

    // to-do: record event here and move processing to poll() which happens
    //        before reading. It's hard to make sense out of band here.

    // Ignore non-primary inputs to avoid flickering between distant points.
    if (!ev.isPrimary) return

    this.bits = this.#evButtonsToBits(ev.buttons)
    this.type = (['mouse', 'touch', 'pen'] as const).find(
      type => type === ev.pointerType,
    )
    const prevClientXY = {x: this.clientXY.x, y: this.clientXY.y}
    ;({clientX: this.clientXY.x, clientY: this.clientXY.y} = ev)
    this.xy = this.#cam.toLevelXY(this.clientXY)

    const delta = xySub(this.clientXY, prevClientXY)
    this.#delta[1] = this.#cam.toScreenXY(delta)

    this.#on |= 1

    if (ev.type === 'pointerdown') {
      this.#canvas.setPointerCapture(ev.pointerId)
      this.dragClientStart.x = this.clientXY.x
      this.dragClientStart.y = this.clientXY.y
      ev.preventDefault() // Not passive.
    }
    this.#drag =
      (this.#drag & 3) |
      (!!this.bits &&
      (this.#drag & 4 || xyDistance(this.clientXY, this.dragClientStart) > 5)
        ? 4
        : 0)
  }

  #onWheel = (ev: WheelEvent): void => {
    if (!ev.isTrusted) return
    this.#wheel[1].x = ev.shiftKey ? ev.deltaY : ev.deltaX
    this.#wheel[1].y = ev.shiftKey ? ev.deltaX : ev.deltaY
    this.#wheel[1].z = ev.deltaZ
  }

  #evButtonsToBits(buttons: number): number {
    let bits = 0
    for (let button = 1; button <= buttons; button <<= 1) {
      if ((button & buttons) !== button) continue
      bits |= this.#bitByButton[button] ?? 0
    }
    return bits
  }
}
