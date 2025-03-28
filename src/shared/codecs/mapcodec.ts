import type {Team} from '../team.ts'
import type {Cell} from '../types/field.ts'

type Elem = Run | Group
type Run = {kind: 'Run'; trit: number; team: Team | undefined; length: number}
type Group = {kind: 'Group'; trits: number[]; teams: Team[]}

const maxRunLength = 264
const maxCellsPerChunk = 102_400 // In largest map, break up into 100 chunks.

/**
 * A map is encoded into a header followed by two sections.
 *
 * The header is 3 bytes, encoding a u24 in big endian, giving the length
 * of section one in bytes. This is so the decoder can seek ahead to
 * section two, and decode from both pairs concurrently.
 *
 * The first section encodes a ternary state for each cell in sequence:
 *
 *     0 = hidden, 1 = claimed, 2 = claimed with mine
 *
 * The second section is a sequence of 2-bit values encoding the team for
 * each claimed cell.
 *
 * The first section uses run-length encoding. The first byte of each run either
 * (A) encodes 5 ternary values (which may be distinct), OR (B) it indicates a
 * run of length 6 or more. If the run length is 9 or more, then the encoded run
 * includes a second byte.
 *
 * In case (A), generate the base-3 representation of the byte value. The highest
 * trit encodes the first cell, the second highest trit the second cell, etc. For
 * each cell that decodes as non-hidden, read the team from the next 2 bits of
 * the second section.
 *
 * In case (B), if the run length is 9 or more, then the value of the first byte
 * is either:
 *
 *     253 = run of N hidden cells
 *     254 = run of N claimed cells
 *     255 = run of N claimed mines
 *
 * In this case, the value of N-9 is encoded in the second byte as a u8 (range
 * of 9-264, inclusive).
 *
 * Otherwise, in case (B), refer to this table.
 *
 *     244 = run of 6 hidden   247 = run of 7 hidden   250 = run of 8 hidden
 *     245 = run of 6 claimed  248 = run of 7 claimed  251 = run of 8 claimed
 *     246 = run of 6 mines    249 = run of 7 mines    252 = run of 8 mines
 *
 * Runs of length 5 or fewer are simply encoded as case (A).
 *
 * The second section is just a series of two bit values. Read from the
 * lowest two bits first, then the second, third, and fourth, before proceeding
 * to the next byte. Each pair of bits encodes a team number.
 */
export class MapCodec {
  async encode(cells: IterableIterator<Cell>): Promise<Uint8Array> {
    const sec1 = new Writer()
    const sec2 = new U2Writer()
    let n = 0
    let chunkCount = 0

    for (const elem of this.#runs(cells)) {
      chunkCount++
      if (chunkCount > maxCellsPerChunk) {
        // yield execution momentarily
        await Promise.resolve()
        chunkCount = 1
      }

      //console.log('elem:', elem)
      if (elem.kind === 'Group') {
        n += elem.trits.length
        let b = 0
        for (const value of elem.trits.reverse()) {
          b = 3 * b + value
        }
        sec1.writeByte(b)
        for (const team of elem.teams) {
          sec2.writeU2(team)
        }
      } else {
        n += elem.length
        if (elem.length < 9) {
          sec1.writeByte(244 + 3 * (elem.length - 6) + elem.trit)
        } else {
          sec1.writeByte(253 + elem.trit)
          sec1.writeByte(elem.length - 9)
        }
        if (elem.trit !== 0) {
          sec2.writeU2(elem.team!)
        }
      }
    }

    const bs1 = sec1.bytes()
    const bs2 = sec2.flush()
    const hdr = new Writer()
    this.#encodeU24(hdr, n)
    this.#encodeU24(hdr, bs1.length)

    const buf = new Uint8Array(6 + bs1.length + bs2.length)
    buf.set(hdr.bytes())
    buf.set(bs1, 6)
    buf.set(bs2, 6 + bs1.length)
    return buf
  }

  *#runs(cells: IterableIterator<Cell>): IterableIterator<Elem> {
    const elem: {
      group?: Group
      run?: Run
    } = {}
    for (const cell of cells) {
      const value = this.#valueOf(cell)
      if (elem.group) {
        elem.group.trits.push(value)
        if (value !== 0) {
          elem.group.teams.push(cell!.team)
        }
        if (elem.group.trits.length === 5) {
          yield elem.group
          delete elem.group
        }
        continue
      }
      if (!elem.run) {
        elem.run = {kind: 'Run', trit: value, team: cell?.team, length: 1}
      } else {
        // Extend the run if we can.
        if (
          value === elem.run.trit &&
          cell?.team === elem.run.team &&
          elem.run.length < maxRunLength
        ) {
          elem.run.length++
          continue
        }

        // Could not extend the run, so we should yield the current run
        // and start a new run with this new value.

        // Simple case: current run is large enough.
        if (elem.run.length > 5) {
          yield elem.run
          elem.run = {kind: 'Run', trit: value, team: cell?.team, length: 1}
          continue
        }

        // Otherwise: Downgrade run to a group.
        elem.group = {
          kind: 'Group',
          trits: Array<number>(elem.run.length).fill(elem.run.trit),
          teams:
            elem.run.trit === 0
              ? []
              : Array<Team>(elem.run.length).fill(elem.run.team!),
        }

        // If group is full, go ahead and emit.
        if (elem.group.trits.length === 5) {
          yield elem.group
          delete elem.group
          elem.run = {kind: 'Run', trit: value, team: cell?.team, length: 1}
          continue
        }

        // Otherwise: push value into group.
        delete elem.run
        elem.group.trits.push(value)
        if (value !== 0) {
          elem.group.teams.push(cell?.team!)
        }
        if (elem.group.trits.length === 5) {
          yield elem.group
          delete elem.group
        }
      }
    }
    if (elem.run) {
      if (elem.run.length <= 5) {
        yield {
          kind: 'Group',
          trits: Array<number>(elem.run.length).fill(elem.run.trit),
          teams:
            elem.run.trit === 0
              ? []
              : Array<Team>(elem.run.length).fill(elem.run.team!),
        }
      } else {
        yield elem.run
      }
    }
    if (elem.group) {
      yield elem.group
    }
  }

  #valueOf(cell: Cell): number {
    if (!cell) {
      return 0
    }
    if (cell.isBan) {
      return 2
    }
    return 1
  }

  *decode(bytes: Uint8Array): IterableIterator<Cell> {
    let cellsRemaining = this.#decodeU24(bytes)
    const sec1Length = this.#decodeU24(bytes.subarray(3, 6))
    const sec1 = bytes.subarray(6, 6 + sec1Length)
    const sec2 = new U2Reader(bytes.subarray(6 + sec1Length))

    for (let i = 0; cellsRemaining > 0 && i < sec1.length; i++) {
      let b = sec1[i]!
      if (b >= 244) {
        const isHidden = (b - 244) % 3 === 0
        const cell = isHidden
          ? undefined
          : {
              isBan: (b - 244) % 3 === 2,
              team: sec2.readU2() as Team,
            }
        if (b >= 253) {
          const n = sec1[++i]! + 9
          for (let j = 0; j < n; j++) {
            cellsRemaining--
            yield cell
          }
        } else {
          const n = Math.floor((b - 244) / 3) + 6
          for (let j = 0; j < n; j++) {
            cellsRemaining--
            yield cell
          }
        }
      } else {
        for (let j = 0; cellsRemaining > 0 && j < 5; j++) {
          const trit = b % 3
          b = Math.floor(b / 3)
          const cell =
            trit === 0
              ? undefined
              : {
                  isBan: trit === 2,
                  team: sec2.readU2() as Team,
                }
          cellsRemaining--
          yield cell
        }
      }
    }
  }

  #encodeU24(w: Writer, n: number): void {
    w.writeByte((n >>> 16) & 0xff)
    w.writeByte((n >>> 8) & 0xff)
    w.writeByte(n & 0xff)
  }

  #decodeU24(bytes: Uint8Array): number {
    return (bytes[0]! << 16) | (bytes[1]! << 8) | bytes[2]!
  }
}

class Writer {
  #bytes: Uint8Array
  #length: number

  constructor() {
    this.#bytes = new Uint8Array(16)
    this.#length = 0
  }

  writeByte(b: number) {
    if (this.#length >= this.#bytes.length) {
      const old = this.#bytes
      this.#bytes = new Uint8Array(old.length * 2)
      this.#bytes.set(old)
    }
    this.#bytes[this.#length++] = b
  }

  bytes(): Uint8Array {
    return this.#bytes.subarray(0, this.#length)
  }
}

class U2Writer {
  #writer = new Writer()
  #curByte = 0
  #curCount = 0

  writeU2(n: number): void {
    // We always flush a byte as soon as we "fill" it, so when we arrive
    // at this point we know it's safe to shift the current byte value
    // left by 2 bits and set n's lowest 2 bits.
    this.#curByte = (this.#curByte << 2) | (n & 3)
    this.#curCount += 2
    if (this.#curCount === 8) {
      this.#writer.writeByte(this.#curByte)
      this.#curByte = 0
      this.#curCount = 0
    }
  }

  flush(): Uint8Array {
    if (this.#curCount > 0) {
      while (this.#curCount < 8) {
        this.#curByte <<= 2
        this.#curCount += 2
      }
      this.#writer.writeByte(this.#curByte)
    }
    return this.#writer.bytes()
  }
}

class U2Reader {
  #bytes: Uint8Array
  #offset = 0
  #curByte = 0
  #curCount = 8

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes
    this.#curByte = bytes[0]!
  }

  readU2(): number {
    this.#curCount -= 2
    const n = (this.#curByte >>> this.#curCount) & 3
    if (this.#curCount === 0) {
      this.#curCount = 8
      this.#offset += 1
      if (this.#offset < this.#bytes.length) {
        this.#curByte = this.#bytes[this.#offset]!
      }
    }
    return n
  }
}
