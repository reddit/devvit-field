/**
 * Validates the field area
 *
 * @param size The size of one side of the board
 * @throws Error if the area validation rule fails
 */
export function validateFieldArea(size: number): void {
  const area = size * size
  if (area > 3200 * 3200) {
    throw new Error(
      `Challenge size too large! This is only for testing right now until we find a more efficient way to return all items in a bitfield. At a minimum, we need to the partition a required command so we don't risk sending 10 million bits at once.`,
    )
  }
}
