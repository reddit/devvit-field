// to-do: move file to types/?

import {
  paletteFlamingo,
  paletteJuiceBox,
  paletteLasagna,
  paletteSunshine,
} from './theme'
import type {T2} from './types/tid'

export type Team = 0 | 1 | 2 | 3
export type TeamPascalCase = 'Flamingo' | 'JuiceBox' | 'Lasagna' | 'Sunshine'
export type TeamTitleCase = 'Flamingo' | 'Juice Box' | 'Lasagna' | 'Sunshine'

export const teams: readonly [Team, Team, Team, Team] = [0, 1, 2, 3]

/** PascalCase team name. */
export const teamPascalCase: {readonly [team in Team]: TeamPascalCase} = {
  0: 'Flamingo',
  1: 'JuiceBox',
  2: 'Lasagna',
  3: 'Sunshine',
}

/**
 * Produces a deterministic team number from a user ID. Randomness is determined
 * by the assembling a number from the character codes of the user ID and returning
 * the remainder of the number divided by 4.
 *
 * TODO: Pull 100,00 userIds and test the distribution
 */
export function getTeamFromUserId(id: T2): Team {
  return (Number.parseInt(id.slice(3), 36) & 3) as Team
}

/** Title case team name. */
export const teamTitleCase: {readonly [team in Team]: TeamTitleCase} = {
  0: 'Flamingo',
  1: 'Juice Box',
  2: 'Lasagna',
  3: 'Sunshine',
}

/** Team color */
export type TeamColor =
  | typeof paletteFlamingo
  | typeof paletteJuiceBox
  | typeof paletteLasagna
  | typeof paletteSunshine

export const teamColor: {
  readonly [team in Team]: TeamColor
} = {
  0: paletteFlamingo,
  1: paletteJuiceBox,
  2: paletteLasagna,
  3: paletteSunshine,
}
