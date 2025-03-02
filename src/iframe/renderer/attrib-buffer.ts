import type {Bmp} from '../graphics/bmp.js'

export type AttribBuffer = {readonly buffer: ArrayBufferView; size: number}

const dims: number = 4

export class BmpAttribBuffer implements AttribBuffer {
  readonly buffer: Uint32Array
  size: number = 0

  constructor(capacity: number) {
    this.buffer = new Uint32Array(capacity * dims)
  }

  push(...bmps: readonly Readonly<Bmp>[]): void {
    for (const bmp of bmps) {
      if (devMode && this.size >= this.buffer.length)
        throw Error('bmp attribute overflow')
      this.buffer[this.size * dims] = bmp._x
      this.buffer[this.size * dims + 1] = bmp._y
      this.buffer[this.size * dims + 2] = bmp._wh
      this.buffer[this.size * dims + 3] = bmp._isffzz
      this.size++
    }
  }
}
