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
 * by creating a simple hash from the last 4 characters of the user ID.
 */
export function getTeamFromUserId(id: T2): Team {
  let hash = 0
  const input = id.slice(id.length - 4)
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // Convert to 32-bit integer
  }

  return (Math.abs(hash) % 4) as Team
}

/**
 * Returns a score for every team, sorted by team number.
 *
 * Useful for filling out team scores from a partial list.
 */
export function fillAndSortByTeamNumber(
  initialCellsClaimed: {member: Team; score: number}[],
): {member: Team; score: number}[] {
  const teams: {member: Team; score: number}[] = [
    {member: 0, score: 0},
    {member: 1, score: 0},
    {member: 2, score: 0},
    {member: 3, score: 0},
  ]

  for (const team of initialCellsClaimed) {
    teams[team.member]!.score = team.score
  }

  return teams
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
