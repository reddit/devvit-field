/** Build config. */
export type Config = {
  /** Aseprite atlas input files directory relative config file. */
  readonly aseDir: string
  /** Atlas output image filename relative config file. */
  readonly atlasImage: string
  /** Atlas output JSON filename relative config file. */
  readonly atlasJSON: string
  /** Atlas tags. */
  readonly tags: {readonly [tag: string]: AnimOffsetConfig}
}

/** Flip XY to offset for keeping sprites aligned when flipping. */
export type AnimOffsetConfig = {
  readonly '00'?: {readonly x?: number; readonly y?: number}
  readonly '01'?: {readonly x?: number; readonly y?: number}
  readonly 10?: {readonly x?: number; readonly y?: number}
  readonly 11?: {readonly x?: number; readonly y?: number}
}
