import type {Bmp} from '../graphics/bmp.js'

export type AttribBuffer = {readonly buffer: ArrayBufferView; size: number}

export class BmpAttribBuffer implements AttribBuffer {
  readonly buffer: Uint32Array
  size: number = 0

  constructor(capacity: number) {
    this.buffer = new Uint32Array(capacity * 3)
  }

  push(...bmps: readonly Readonly<Bmp>[]): void {
    for (const bmp of bmps) {
      if (devMode && this.size >= this.buffer.length)
        throw Error('bmp attribute overflow')
      this.buffer[this.size * 3] = bmp._xy
      this.buffer[this.size * 3 + 1] = bmp._wh
      this.buffer[this.size * 3 + 2] = bmp._iffzz
      this.size++
    }
  }
}
