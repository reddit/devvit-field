export async function staggerMap<T>(
  elems: readonly T[],
  durMs: number,
  fn: (elems: T[]) => void,
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
  readonly #elems: readonly T[]
  #arrivals: number[]
  #fn: (elems: T[]) => void
  #idx: number = 0

  constructor(
    elems: readonly T[],
    arrivals: number[],
    fn: (elem: T[]) => void,
  ) {
    this.#elems = elems
    this.#arrivals = arrivals
    this.#fn = fn
  }

  processAt(elapsedMs: number): boolean {
    const elems = []
    // Consume head of elems with past arrival times.
    let nextIdx: number
    for (
      nextIdx = this.#idx;
      nextIdx < this.#arrivals.length && this.#arrivals[nextIdx]! <= elapsedMs;
      nextIdx++
    )
      elems.push(this.#elems[nextIdx]!)
    if (elems.length) this.#fn(elems)
    this.#idx = nextIdx
    return this.#idx < this.#arrivals.length
  }
}
