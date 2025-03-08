import type {FieldConfig} from '../../shared/types/field-config.ts'
import type {Input} from '../input/input.ts'
import type {AttribBuffer} from '../renderer/attrib-buffer.ts'
import type {Cam} from '../renderer/cam.ts'
import type {Renderer} from '../renderer/renderer.ts'

/** Manages window lifecycle for input and rendering. */
export class Looper {
  /** The run lifetime in millis. */
  age: number = 0
  /** The exact duration in millis to apply on a given update step. */
  millis: number = 0
  onPause: () => void = () => {}
  onResize: () => void = () => {}
  onResume: () => void = () => {}
  /** The relative timestamp in millis. */
  time: number | undefined

  readonly #canvas: HTMLCanvasElement
  readonly #cam: Cam
  readonly #ctrl: Input<string>
  #frame: number | undefined
  #loop: (() => void) | undefined
  readonly #renderer: Renderer

  constructor(
    canvas: HTMLCanvasElement,
    cam: Cam,
    ctrl: Input<string>,
    renderer: Renderer,
  ) {
    this.#canvas = canvas
    this.#cam = cam
    this.#ctrl = ctrl
    this.#renderer = renderer
  }

  cancel(): void {
    this.#pause()
    this.#loop = undefined
  }

  get frame(): number {
    // Assume 60 FPS so games can scale to this number regardless of actual.
    return Math.trunc(this.age / (1000 / 60))
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    for (const type of ['webglcontextlost', 'webglcontextrestored'])
      this.#canvas[fn](type, this.#onEvent, true)
    globalThis[fn]('visibilitychange', this.#onEvent, true)
    if (op === 'add') this.#renderer.initGL()
  }

  render(
    bmps: Readonly<AttribBuffer>,
    fieldConfig: Readonly<FieldConfig>,
    loop: (() => void) | undefined,
  ): void {
    this.#loop = loop
    if (document.hidden || !this.#renderer.hasContext()) return
    if (this.#loop) this.#frame ??= requestAnimationFrame(this.#onFrame)
    this.#renderer.render(
      this.#cam,
      fieldConfig,
      this.frame,
      bmps,
      this.#cam.fieldScale,
    )
  }

  #onEvent = (ev: Event): void => {
    if (!ev.isTrusted) return
    ev.preventDefault()
    if (ev.type === 'webglcontextrestored') this.#renderer.initGL()

    if (this.#renderer.hasContext() && !document.hidden) {
      if (this.#loop) {
        if (!this.time) this.onResume()
        this.#frame ??= requestAnimationFrame(this.#onFrame)
      }
    } else this.#pause()
  }

  #onFrame = (time: number): void => {
    this.#frame = undefined
    this.millis = time - (this.time ?? time)
    this.time = time
    this.age += this.millis
    const loop = this.#loop
    this.#loop = undefined

    this.onResize()
    this.#cam.resize(this.#canvas)

    this.#ctrl.poll(this.millis)
    loop?.()
  }

  #pause(): void {
    if (this.time) this.onPause()
    if (this.#frame != null) cancelAnimationFrame(this.#frame)
    this.#frame = undefined
    this.millis = 0
    this.time = undefined
    this.#ctrl.reset()
  }
}
