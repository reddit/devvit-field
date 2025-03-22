export async function staggerMap<T>(
  elems: readonly T[],
  durMs: number,
  fn: (elem: T) => void,
): Promise<void> {
  if (!elems?.length) {
    return
  }

  // Generate arrival times using a Poisson model. If we end up exceeding durMs,
  // we'll just lump the late arrivals in the final frame.
  const startTime = performance.now()
  const endTime = startTime + durMs
  const arrivalRate = elems.length / durMs
  const arrivals = new Array<number>(elems.length)
  let t = 0
  for (let i = 0; i < arrivals.length; i++) {
    t += -Math.log(1 - Math.random()) / arrivalRate
    arrivals[i] = Math.min(endTime, t + startTime)
  }

  const processor = new ScheduledProcessor(elems, arrivals, fn)
  const onFrame = (elapsedMs: number) => {
    if (processor.processAt(elapsedMs)) requestAnimationFrame(onFrame)
  }
  requestAnimationFrame(onFrame)
}

class ScheduledProcessor<T> {
  readonly #elems: Readonly<T[]>
  #arrivals: number[]
  #fn: (elem: T) => void
  #idx: number = 0

  constructor(elems: Readonly<T[]>, arrivals: number[], fn: (elem: T) => void) {
    this.#elems = elems
    this.#arrivals = arrivals
    this.#fn = fn
  }

  processAt(elapsedMs: number): boolean {
    // Consume head of elems with past arrival times.
    let nextIdx: number
    for (
      nextIdx = this.#idx;
      nextIdx < this.#arrivals.length && this.#arrivals[nextIdx]! <= elapsedMs;
      nextIdx++
    ) {
      this.#fn(this.#elems[nextIdx]!)
    }
    this.#idx = nextIdx
    return this.#idx < this.#arrivals.length
  }
}
