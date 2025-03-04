import type {WH} from './2d.ts'

export type FieldConfig = {
  /**
   * The total number of bans present in the field. User to calculate
   * percentages.
   */
  bans: number
  /** Width and height of each partition in boxes. */
  partSize: number
  /** Width and height of field in boxes. */
  wh: WH
}
