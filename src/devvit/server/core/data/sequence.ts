/**
 *
 * @param challengeNumber
 * @returns Redis key for the most recent sequence number written
 */
export function getDeltaSequenceNumber(challengeNumber: number): string {
  return `challenge:${challengeNumber}:deltas_sequence` as const
}
