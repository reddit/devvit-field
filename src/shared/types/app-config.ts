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
}

/** Number of boxes per side of the minimap. */
export const mapSize: number = 120

export function getDefaultAppConfig(): AppConfig {
  return {
    globalClickCooldownMillis: 1000,
    globalServerPollingTimeMillis: 60_000,
    globalReloadSequence: 0,
  }
}
