import type {T2} from './types/tid'

export type Team = 0 | 1 | 2 | 3

export const teams: Team[] = [0, 1, 2, 3]

/**
 * Produces a deterministic team number from a user ID. Randomness is determined
 * by the assembling a number from the character codes of the user ID and returning
 * the remainder of the number divided by 4.
 */
export function getTeamFromUserId(id: T2): Team {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0 // Convert to 32-bit integer
  }

  return (Math.abs(hash) % 4) as Team
}
