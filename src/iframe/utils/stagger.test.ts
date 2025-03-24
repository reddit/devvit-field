import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {staggerMap} from './stagger'

class MockRequestAnimationFrame {
  fn: FrameRequestCallback | undefined

  call(fn: FrameRequestCallback): number {
    this.fn = fn
    return Date.now()
  }

  nextFrame(timeMs: number) {
    if (this.fn) {
      const fn = this.fn
      this.fn = undefined
      fn(timeMs)
    }
  }
}

describe('stagger', async () => {
  let mock: MockRequestAnimationFrame

  beforeEach(() => {
    mock = new MockRequestAnimationFrame()
    vi.stubGlobal('requestAnimationFrame', mock.call.bind(mock))
  })
  afterEach(vi.unstubAllGlobals)

  it('zero elems', async () => {
    await staggerMap<void>([], 100, _ => {
      expect.fail('unreachable')
    })
  })

  it('640,000 arrivals over 1 second at 60 hz', async () => {
    const elems = new Array<number>(640_000)
    for (let i = 0; i < elems.length; i++) {
      elems[i] = i
    }
    let frameCount = 0
    let frameTime = 0
    let dupes = 0
    const renders = new Map<number, number>()
    const seen = new Array<boolean>(640_000).fill(false)
    const start = performance.now()
    const p = staggerMap(elems, 1_000, (v: number[]) => {
      for (const vv of v) {
        if (seen[vv]) {
          dupes++
        }
        seen[vv] = true
        renders.set(frameCount, (renders.get(frameCount) ?? 0) + 1)
      }
    })

    for (let f = 1; f <= 61; f++) {
      frameCount = f
      frameTime = start + (f * 1_000) / 60
      mock.nextFrame(frameTime)
    }
    await p

    expect(dupes).toStrictEqual(0)
    expect(renders.size).toBeGreaterThanOrEqual(59)
    expect(renders.size).toBeLessThanOrEqual(61)
    /*
    for (const [frameCount, count] of renders) {
      console.log(`${frameCount}: ${count}`)
    }
     */
  })
})
