import type {WH, XY} from './types/2d.ts'

export class Bitfield {
  /** Cell width in bits; [1, 8]. */
  readonly cellW: number
  /** Partition dimensions in cells; both dimensions in [1, ∞). */
  readonly partWH: Readonly<WH>
  /** Field dimensions in columns and rows; both dimensions in [1, ∞). */
  readonly wh: Readonly<WH>
  // we need to able to replace rectangular regions fast so we don't want a linear data structure with strides.
  readonly #field: readonly (readonly Uint8Array[])[]

  constructor(wh: Readonly<WH>, partWH: Readonly<WH>, cellW: number) {
    this.cellW = cellW
    this.partWH = {w: partWH.w, h: partWH.h}
    this.wh = {w: wh.w, h: wh.h}

    // to-do: this is broken for the intended use case. The GL textures can't be
    //        linear. Every row is has to be ceil.
    // Math.ceil((partWH.w * this.cellW) / 8) *
    // Math.ceil((partWH.h * this.cellW) / 8)
    const bytes = Math.ceil((partWH.w * partWH.h * this.cellW) / 8)
    const field: Uint8Array[][] = []
    for (let row = 0; row < wh.h; row++) {
      field[row] ??= []
      for (let col = 0; col < wh.w; col++)
        field[row]![col] = new Uint8Array(bytes)
    }
    this.#field = field
  }

  getCell(xy: Readonly<XY>): number | undefined {
    if (xy.x < 0 || xy.y < 0) return
    xy = {x: Math.trunc(xy.x), y: Math.trunc(xy.y)}
    const part = this.getPart(xy)
    if (!part) return

    return getCell(part, this.#indexOf(xy), this.cellW)
  }

  getPart(xy: Readonly<XY>): Uint8Array | undefined {
    const col = Math.trunc(xy.x / this.partWH.w)
    const row = Math.trunc(xy.y / this.partWH.h)
    return this.#field[row]?.[col]
  }

  getPartByColRow(col: number, row: number): Uint8Array | undefined {
    return this.#field[row]?.[col]
  }

  setCell(xy: Readonly<XY>, val: number): void {
    if (xy.x < 0 || xy.y < 0) return
    xy = {x: Math.trunc(xy.x), y: Math.trunc(xy.y)}
    const part = this.getPart(xy)
    if (!part) return

    setCell(part, this.#indexOf(xy), this.cellW, val)
  }

  toString(): string {
    let str = '\n'
    for (let y = 0; y < this.wh.h * this.partWH.h; y++) {
      for (let x = 0; x < this.wh.w * this.partWH.w; x++)
        str += `${this.getCell({x, y})!.toString(16)} `
      str += '\n'
    }
    return str
  }

  #indexOf(xy: Readonly<XY>): number {
    return (xy.y % this.partWH.h) * this.partWH.w + (xy.x % this.partWH.w)
  }
}

/** @internal */
export function getCell(arr: Uint8Array, i: number, w: number): number {
  const bit = i * w // Bit position.
  const byte = bit >>> 3 // Byte position; divide by 8 and truncate.
  const window = ((arr[byte]! << 8) | (arr[byte + 1] ?? 0)) & 0xffff
  const shift = 16 - (bit & 7) - w // 16 - bit % 8 - w.
  const mask = (1 << w) - 1
  return (window >>> shift) & mask
}

/** @internal */
export function setCell(
  arr: Uint8Array,
  i: number,
  w: number,
  val: number,
): void {
  const bit = i * w
  const byte = bit >>> 3
  const window = ((arr[byte]! << 8) | (arr[byte + 1] ?? 0)) & 0xffff
  const shift = 16 - (bit & 7) - w
  const mask = (1 << w) - 1

  const merged = (window & ~(mask << shift)) | ((val & mask) << shift)

  arr[byte] = merged >>> 8
  arr[byte + 1] = merged & 0xff
}
