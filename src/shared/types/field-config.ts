import type {WH} from './2d.ts'

export type FieldConfig = {
  /** Width and height of each partition in boxes. */
  partSize: number
  /** Width and height of field in boxes. */
  wh: WH
}
