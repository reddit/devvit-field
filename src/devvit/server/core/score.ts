// TODO: Write algorithm for scoring and ending the game

import type {Team} from '../../../shared/team'

export type ComputeScoreResponse = {
  /** Is the game over */
  isOver: boolean
  /** The team that win */
  winner?: Team | undefined
  /** The remaining % of the grid (0 - 100) */
  remainingPercentage: number
}

export const computeScore = ({
  size,
  teams,
}: {
  /** Size of the grid */
  size: number
  /** Teams playing */
  teams: {member: Team; score: number}[]
}): ComputeScoreResponse => {
  const area = size * size

  const claimedSquares = teams.reduce((acc, {score}) => acc + score, 0)
  const remainingSquares = area - claimedSquares

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score)
  const topTeam = sortedTeams[0]
  const secondTeam = sortedTeams[1]

  if (!topTeam || !secondTeam)
    throw new Error('There must be at least two teams to score the game')

  // Calculate the difference between the top team and second team
  const difference = topTeam.score - (secondTeam?.score ?? 0)

  // The game is over if:
  // - The top team cannot be caught: difference > remainingSquares
  // - OR there are no squares left to claim
  const isOver = difference > remainingSquares || remainingSquares === 0

  // TODO Handle the tie case?
  // if(difference === 0 && remainingSquares === 0) {
  // }

  return {
    isOver,
    winner: isOver ? topTeam.member : undefined,
    remainingPercentage: Math.round((remainingSquares / area) * 100),
  }
}
