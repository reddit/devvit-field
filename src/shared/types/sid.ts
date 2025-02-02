import {V4, noV4} from './v4.ts'

/**
 * Session / screen identity. reset on app (re)load. noSID in headless contexts
 * (eg, triggers).
 */
export type SID = `sid-${V4}`

export const noSID: SID = `sid-${noV4}`

export function SID(): SID {
  return `sid-${V4()}`
}
