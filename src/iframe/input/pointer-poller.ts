import type {XY, XYZ} from '../../shared/types/2d.ts'
import type {Cam} from '../renderer/cam.ts'

export class PointerPoller {
  bits: number = 0
  allowContextMenu: boolean = false // Suppress right-click.
  readonly clientXY: XY = {x: 0, y: 0}
  type: 'mouse' | 'touch' | 'pen' | undefined
  xy: Readonly<XY> = {x: 0, y: 0}
  readonly #bitByButton: {[btn: number]: number} = {}
  readonly #cam: Readonly<Cam>
  readonly #canvas: HTMLCanvasElement
  #on: number = 0
  #wheel: [XYZ, XYZ] = [
    {x: 0, y: 0, z: 0},
    {x: 0, y: 0, z: 0},
  ]

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#cam = cam
    this.#canvas = canvas
  }

  map(button: number, bit: number): void {
    this.#bitByButton[button] = bit
  }

  // to-do: clarify this is for including movement and align with Input.gestured.
  get on(): boolean {
    return (this.#on & 3) !== 0
  }

  poll(): void {
    this.#on <<= 1
    this.#wheel[0] = this.#wheel[1]
    this.#wheel[1] = {x: 0, y: 0, z: 0}
  }

  register(op: 'add' | 'remove'): void {
    const fn = <const>`${op}EventListener`
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
    this.type = undefined
    this.#on = 0
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

    // Ignore non-primary inputs to avoid flickering between distant points.
    if (!ev.isPrimary) return

    if (ev.type === 'pointerdown') this.#canvas.setPointerCapture(ev.pointerId)

    this.bits = this.#evButtonsToBits(ev.buttons)
    this.type = (<const>['mouse', 'touch', 'pen']).find(
      type => type === ev.pointerType,
    )
    ;({clientX: this.clientXY.x, clientY: this.clientXY.y} = ev)
    this.xy = this.#cam.toLevelXY(this.clientXY)
    this.#on |= 1
    if (ev.type === 'pointerdown') ev.preventDefault() // Not passive.
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
