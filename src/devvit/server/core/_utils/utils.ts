interface MatrixConfig {
  result: string
  cols: number
  rows: number
  bitsPerCell?: number
}

/**
 * A helper that produces a matrix from a buffer to visualize what's happening
 */
export function toMatrix({
  result,
  cols,
  rows,
  bitsPerCell = 3,
}: MatrixConfig): number[][] {
  // Create matrix filled with zeros
  const matrix: number[][] = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0))

  // Convert buffer to binary string
  const binaryString: string = [...Buffer.from(result)]
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('')

  // Fill matrix
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const bitOffset: number = (row * cols + col) * bitsPerCell
      const cellBits: string = binaryString.slice(
        bitOffset,
        bitOffset + bitsPerCell,
      )
      matrix[row]![col] = parseInt(cellBits, 2)
    }
  }

  return matrix
}
