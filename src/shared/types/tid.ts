// to-do: TIDs should be exported from @devvit/public-api.

/** Comment ID. */
export type T1 = `t1_${string}`
/** Reddit user ID. */
export type T2 = `t2_${string}`
/** Reddit post ID. */
export type T3 = `t3_${string}`
/** Subreddit ID. */
export type T5 = `t5_${string}`

export const noT1: T1 = 't1_0'
export const noT2: T2 = 't2_0'
export const noT3: T3 = 't3_0'
export const noT5: T5 = 't5_0'

export const noSnoovatarURL: string =
  'https://www.redditstatic.com/shreddit/assets/thinking-snoo.png'
export const noUsername: string = 'anonymous'

export function isT1(t1: string | undefined): t1 is T1 {
  return !!t1?.startsWith('t1_')
}

export function isT2(t2: string | undefined): t2 is T2 {
  return !!t2?.startsWith('t2_')
}

export function isT3(t3: string | undefined): t3 is T3 {
  return !!t3?.startsWith('t3_')
}

export function isT5(t5: string | undefined): t5 is T5 {
  return !!t5?.startsWith('t5_')
}

export function T1(t1: string): T1 {
  if (isT1(t1)) return t1
  throw Error(`${t1} must start with t1_`)
}

export function T2(t2: string): T2 {
  if (isT2(t2)) return t2
  throw Error(`${t2} must start with t2_`)
}

export function T3(t3: string): T3 {
  if (isT3(t3)) return t3
  throw Error(`${t3} must start with t3_`)
}

export function T5(t5: string): T5 {
  if (isT5(t5)) return t5
  throw Error(`${t5} must start with t5_`)
}
