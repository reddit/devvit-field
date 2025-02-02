// to-do: compile-time constant to enable dead code removal.
/** Development mode; no Devvit. */
export const devMode: boolean = globalThis.location?.port === '1234'
