import {type UTCMillis, utcMillisNow} from './types/time.ts'

export class Throttle<T extends unknown[]> {
  fn: (this: undefined, ...args: T) => void
  /** Minimum time between calls in millis. */
  readonly period: number
  /** Most recent scheduled arguments. */
  #args: T | undefined
  /** Previous execution. */
  #exec: UTCMillis = 0 as UTCMillis
  /** Outstanding timeout ID. */
  #timeout: number | undefined

  constructor(fn: (this: undefined, ...args: T) => void, period: number) {
    this.fn = fn
    this.period = period
  }

  cancel(): void {
    if (this.#timeout != null) clearTimeout(this.#timeout)
    this.#timeout = undefined
    this.#args = undefined
  }

  /** Schedule a new function call overwriting any previous. */
  schedule(...args: T): void {
    this.#args = args
    this.#timeout ??= setTimeout(
      () => {
        this.#exec = utcMillisNow()
        this.#timeout = undefined
        const args = this.#args!
        this.#args = undefined
        this.fn.apply(undefined, args)
      },
      Math.max(0, this.period - (utcMillisNow() - this.#exec)),
    )
  }
}
