import type {Team} from './team'

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
