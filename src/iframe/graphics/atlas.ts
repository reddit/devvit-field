import type {Box, XY} from '../../shared/types/2d.ts'

export type Atlas<T> = {
  readonly anim: {readonly [tag in T & TagFormat]: Anim<T>}
  /**
   * Animation cel XYWH ordered by ID. Every animation is padded to 16 cels
   * (maxAnimCels) as needed by repeating the sequence.
   */
  readonly cels: readonly number[]
}

export type Anim<T = unknown> = {
  /** Outgoing collision rectangle (red / blue). */
  readonly hitbox?: Readonly<Box> | undefined
  /** Incoming collision rectangle (green / blue). */
  readonly hurtbox?: Readonly<Box> | undefined
  /** Atlas.cels index, a multiple of 16 (maxAnimCels). */
  readonly id: number
  readonly offset: AnimOffset
  readonly tag: T & TagFormat
  /** Clipbox width. */ readonly w: number
  /** Clipbox height. */ readonly h: number
}

/** Flip XY bits to translation. */
export type AnimOffset = {
  readonly '00': Readonly<XY>
  readonly '01': Readonly<XY>
  readonly 10: Readonly<XY>
  readonly 11: Readonly<XY>
}

/** `--tagname-format={filestem}--{animation}`. */
export type TagFormat = `${string}--${string}`
