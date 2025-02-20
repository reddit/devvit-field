/**
 * NOTE: I am mostly clueless on bitwise ops. This file is heavily influenced by AI and could be
 * total nonsense. If you are reading this and have better ideas, please teach me your ways!
 */

import type {Team} from '../../../shared/team'

type Claimed = 0 | 1

/**
 * Encodes the claimed and team values into a single number used in the bitfield.
 */
export function encodeVTT(claimed: Claimed, team: Team): number {
  // (claimed << 2) + (team)
  return ((claimed & 0b1) << 2) | (team & 0b11)
}

/**
 * Decodes the claimed and team values from a single number used in the bitfield.
 */
export function decodeVTT(value: number): {
  claimed: Claimed
  team: Team
} {
  const team = (value & 0b11) as Team
  const claimed = ((value >> 2) & 0b1) as Claimed
  return {claimed, team}
}

/**
 * Returns a flat array of `width * height` numbers,
 * each representing the 3-bit value read from the buffer in row-major order.
 *
 * For each pixel, we read exactly 3 bits.
 * If the buffer is too short, we treat missing bits as 0.
 */
export function parseBitfieldToFlatArray(
  buffer: Buffer,
  cols: number,
  rows: number,
  bitsPerCell: number = 3,
): number[] {
  const totalCells = cols * rows
  const result: number[] = []

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    let value = 0
    for (let bitIndex = 0; bitIndex < bitsPerCell; bitIndex++) {
      // The absolute bit offset within the entire buffer
      const absoluteBit = cellIndex * bitsPerCell + bitIndex

      // Which byte in the buffer this bit belongs to
      const bytePos = absoluteBit >>> 3 // integer division by 8
      // Which bit in that byte (0 = most significant bit if we follow Redis ordering)
      const bitInByte = absoluteBit % 8

      // Redis documentation says bit #0 is the *most significant bit* of the byte.
      // So we shift by (7 - bitInByte) to isolate that particular bit.
      const bit = (buffer[bytePos]! >> (7 - bitInByte)) & 1

      // Shift our accumulated value left by 1 and add this new bit.
      value = (value << 1) | bit
    }
    result.push(value)
  }

  return result
}
