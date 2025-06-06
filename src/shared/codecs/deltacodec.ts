import {makePartitionKey} from '../partition.ts'
import type {Team} from '../team.ts'
import type {XY} from '../types/2d.ts'
import type {Delta} from '../types/field.ts'

const b0BanMask = 32
const b0PosMask = b0BanMask - 1

const maxDeltasPerChunk = 200

export type DeltaSnapshotKey = FieldS3Key & {
  kind: S3Kind
  /** Multiply by partition size ot get global. */
  partitionXY: XY
  noChange: boolean
}

export type S3Kind = 'deltas' | 'partition'

/** All the variables needed to make an S3 request except the partition. */
export type FieldS3Key = {
  pathPrefix: string
  challengeNumber: number
  sequenceNumber: number
  subredditId: string
}

/** Every period partitions (replace / bitmap) are available. */
export const partitionPeriod: number = 10

export function fieldS3URL(key: DeltaSnapshotKey): string {
  const path = fieldS3Path(key)
  return `https://webview.devvit.net/${publicPath(path)}`
}

export function fieldS3Path(key: DeltaSnapshotKey): string {
  const kind = key.kind === 'deltas' ? 'd' : 'p'
  const pkey = makePartitionKey(key.partitionXY)
  return `${key.pathPrefix}/${pkey}/${key.subredditId}/${kind}/${key.challengeNumber}/${key.sequenceNumber}`
}

function publicPath(path: string): string {
  // Due to a quirk of our Fastly VCL, we need to prefix the S3 key with "platform",
  // but must omit it from the URL.
  const prefix = 'platform/'
  if (path.startsWith(prefix)) {
    path = path.slice(prefix.length)
  }
  return path
}

/**
 * The DeltaCodec encodes a sequence of deltas as three bytes per delta.
 *
 * Deltas have an (x,y) coordinate relative to the global map. In encoding
 * we convert them to much smaller partition-local coordinates, and reduce
 * to one dimension as follows: y * partitionSize + x.
 *
 * With a supported partitionSize of 1448, we can pack all the info
 * of a Delta into 3 bytes (24 bits):
 *   - offset = 21 bits
 *   - team = 2 bits
 *   - isBan = 1 bit
 *
 * Example:
 *   globalCoord   = (1,2)
 *   partitionSize = 800
 *   deltas = [
 *     {xy:{x:800,y:1600},team:1,isBan:false},
 *     {xy:{x:1599,y:2399},team:2,isBan:true},
 *   ]
 *
 * The binary and hex encoding would be:
 *
 *   byte |  binary  | hex | meaning
 *   -----+----------+-----+---------------
 *     0  | 01000000 |  40 | Team is 01=1, isBan=0, bits 16-20 of offset=0
 *     1  | 00000000 |  00 | Bits 8-15 of offset=0
 *     2  | 00000000 |  00 | Bits 0-7 of offset=0
 *     3  | 10101001 |  a9 | Team is 10=2, isBan=1, bits 16-20 of offset=9
 *     4  | 11000011 |  c3 | Bits 8-15 of offset=195
 *     5  | 11111111 |  ff | Bits 0-7 of offset=255
 *
 * For the second entry, the decoder would parse out an offset of:
 *
 *     9 * 65536 + 195 * 256 + 255 = 639999
 *     x = 1 * 800 + 639999 % 800 = 800 + 799 = 1599
 *     y = 2 * 800 + 639999 / 800 = 1600 + 799 = 2399
 */
export class DeltaCodec {
  // The position in the global field of the top-left corner of this partition.
  readonly #topLeft: XY
  readonly #partitionSize: number

  // Constructs codec for deltas for a partition in a given location.
  constructor(partXY: XY, partitionSize: number) {
    this.#topLeft = {
      x: partXY.x * partitionSize,
      y: partXY.y * partitionSize,
    }
    this.#partitionSize = partitionSize
  }

  async encode(deltas: Delta[]): Promise<Uint8Array> {
    // Each delta is encoded as three bytes.
    // The first three bytes are a u24 position, given in big endian order.
    // The final byte gives the state of the cell.
    const bytes = new Uint8Array(3 * deltas.length)
    for (const [i, delta] of deltas.entries()) {
      this.#encodeDelta(bytes.subarray(3 * i, 3 * (i + 1)), delta)
      if (i > 0 && i % maxDeltasPerChunk === 0) {
        await Promise.resolve()
      }
    }
    return bytes
  }

  #encodeDelta(bytes: Uint8Array, delta: Delta) {
    // Translate delta.globalXY to a linear offset within the partition.
    const x = delta.globalXY.x - this.#topLeft.x
    const y = delta.globalXY.y - this.#topLeft.y
    const pos = y * this.#partitionSize + x

    // Encode pos into 3 bytes, big endian.
    let b0 = (pos >>> 16) & 0xff
    const b1 = (pos >>> 8) & 0xff
    const b2 = pos & 0xff

    // Set the upper bits of b0 to indicate team and isBan.
    b0 |= (delta.team << 6) & 0xff
    b0 |= delta.isBan ? b0BanMask : 0

    bytes.set([b0, b1, b2], 0)
  }

  decode(bytes: Uint8Array): Delta[] {
    const deltas: Delta[] = []
    for (let i = 0; i < bytes.length; i += 3) {
      deltas.push(this.#decodeDelta(bytes.subarray(i, i + 3)))
    }
    return deltas
  }

  #decodeDelta(bytes: Uint8Array): Delta {
    const b0 = bytes[0]!
    const pos = ((b0 & b0PosMask) << 16) | (bytes[1]! << 8) | bytes[2]!
    return {
      globalXY: {
        x: this.#topLeft.x + (pos % this.#partitionSize),
        y: this.#topLeft.y + Math.floor(pos / this.#partitionSize),
      },
      isBan: (b0 & b0BanMask) === b0BanMask,
      team: (b0 >> 6) as Team,
    }
  }
}
