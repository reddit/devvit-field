/**
 * Application configuration for which updates can be pushed mid-event.
 * Fields named starting with "global" are handled specially as global settings.
 */
export type AppConfig = {
  /**
   * How long to force the user to wait before clicking again in the UI.
   * Configured globally.
   */
  globalClickCooldownMillis: number

  /**
   * How long clients should wait before polling the server for updates.
   * Configured globally.
   */
  globalServerPollingTimeMillis: number

  /**
   * If this counter is changed, all clients should reload the page.
   * The specific value doesn't matter.
   * Configured globally.
   */
  globalReloadSequence: number

  /**
   * Maximum missed realtime patch messages tolerated before downloading a
   * replace; ints in [0, ∞).
   */
  globalFetcherMaxDroppedPatches: number

  /**
   * Maximum missed realtime patch messages tolerated before downloading a
   * replace; ints in [0, ∞).
   */
  globalFetcherMaxParallelS3Fetches: number
  /**
   * Maximum duration a partition waits for a realtime sequence update before
   * considering artificial sequence number injection; ints in [0, ∞).
   */
  globalFetcherMaxSeqAgeMillis: number
  /**
   * Maximum duration without a realtime update before the partition poller
   * starts guessing sequence numbers; ints in [0, ∞). Duration resets on next
   * update but not on guesses.
   */
  globalFetcherMaxRealtimeSilenceMillis: number
  /**
   * When guessing at sequence numbers, how far (backward is negative, forward
   * is positive) to adjust the guess to increase the likelihood that the
   * sequence exists; ints in (-∞, ∞).
   */
  globalFetcherGuessOffsetMillis: number
  /** The minimum duration between requests; ints in [0, ∞). */
  globalFetcherFetchRestMillis: number
  /**
   * The max sequences to go without fetching a replace instead of just deltas;
   * ints in [0, ∞).
   */
  globalFetcherMandatoryReplaceSequencePeriod: number
}

/** Number of boxes per side of the minimap. */
export const mapSize: number = 120

export function getDefaultAppConfig(): AppConfig {
  return {
    globalClickCooldownMillis: 1000,
    globalServerPollingTimeMillis: 60_000,
    globalReloadSequence: 0,
    globalFetcherMaxDroppedPatches: 5,
    globalFetcherMaxParallelS3Fetches: 4,
    globalFetcherMaxSeqAgeMillis: 2_000,
    globalFetcherMaxRealtimeSilenceMillis: 5_000,
    globalFetcherGuessOffsetMillis: -1_000,
    globalFetcherFetchRestMillis: 300,
    globalFetcherMandatoryReplaceSequencePeriod: 100,
  }
}
