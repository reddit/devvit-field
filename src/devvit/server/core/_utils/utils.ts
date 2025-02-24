import {decodeVTT} from '../bitfieldHelpers'

interface MatrixConfig {
  result: number[]
  cols: number
  rows: number
}

/**
 * A helper that produces a matrix from a buffer to visualize what's happening. Used
 * in unit tests and debugging.
 */
export function toMatrix({result, cols, rows}: MatrixConfig): string[][] {
  // Create matrix filled with zeros
  const matrix: string[][] = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0))

  // Fill matrix
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellIndex = row * cols + col

      const decoded = decodeVTT(result[cellIndex]!)
      matrix[row]![col] = decoded.claimed === 1 ? decoded.team.toString() : '_'
    }
  }

  return matrix
}
