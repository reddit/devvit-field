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
   * How often clients should send a heartbeat to the server for their
   * active player status.
   */
  globalActivePlayerHeartbeatMillis: number

  /**
   * If this counter is changed, all clients should reload the page.
   * The specific value doesn't matter.
   * Configured globally.
   */
  globalReloadSequence: number

  // Partition data fetcher.
  /** Debug mode; ints in [0, ∞). 0 is off, great is verbose.  */
  globalPDFDebug: number

  /**
   * Maximum duration without a realtime update before guessing sequences; ints
   * in [0, ∞).
   */
  globalPDFGuessAfterMillis: number

  /**
   * When guessing sequences, how far (backward is negative, forward is
   * positive) to adjust the guess to increase the likelihood that the sequence
   * exists; ints in (-∞, ∞).
   */
  globalPDFGuessOffsetMillis: number

  /**
   * Maximum missed realtime patch messages before preferring a partition
   * replace; ints in [0, ∞). Doesn't include no-change patches.
   */
  globalPDFMaxDroppedPatches: number

  /** Maximum concurrent fetch threads across all partitions; ints in [1, 16]. */
  globalPDFMaxParallelFetches: number

  /**
   * The max sequences to go without fetching a replace instead of just patches;
   * ints in [0, ∞).
   */
  globalPDFMaxPatchesWithoutReplace: number
}

export function getDefaultAppConfig(): AppConfig {
  return {
    globalClickCooldownMillis: 1000,
    globalActivePlayerHeartbeatMillis: 30_000,
    globalReloadSequence: 0,
    globalPDFDebug: 0,
    globalPDFGuessAfterMillis: 10_000,
    globalPDFGuessOffsetMillis: -1_000,
    globalPDFMaxDroppedPatches: 5,
    globalPDFMaxParallelFetches: 4,
    globalPDFMaxPatchesWithoutReplace: 100,
  }
}
