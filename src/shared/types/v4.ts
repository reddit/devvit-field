/** UUID v4. */
export type V4 = ReturnType<Crypto['randomUUID']>

export const noV4: V4 = '00000000-0000-0000-0000-000000000000'

/** Generates a UUID v4. */
export function V4(): V4 {
  return crypto.randomUUID()
}
