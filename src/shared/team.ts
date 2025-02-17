// to-do: move file to types/?

import type {T2} from './types/tid'

export type Team = 0 | 1 | 2 | 3

export const teams: readonly [Team, Team, Team, Team] = [0, 1, 2, 3]

/** Printable team name. */
export const teamName: {readonly [team in Team]: string} = {
  0: 'Flamingo',
  1: 'Juice Box',
  2: 'Lasagna',
  3: 'Sunshine',
}

/**
 * Produces a deterministic team number from a user ID. Randomness is determined
 * by the assembling a number from the character codes of the user ID and returning
 * the remainder of the number divided by 4.
 */
export function getTeamFromUserId(id: T2): Team {
  // to-do: revise or add unit tests to verify even distribution. We don't want
  //        the majority of people landing on one team. I think T2s are base 36.
  //        If so, we can do something like
  //        `Number.parseInt(t2.slice(3), 36) & 3`.
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0 // Convert to 32-bit integer
  }

  return (Math.abs(hash) % 4) as Team
}
