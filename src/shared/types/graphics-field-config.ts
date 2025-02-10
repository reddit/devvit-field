import type {WH} from './2d.ts'

/**
 * Not to be confused with Redis partitions.
 *
 * Number of cells = field.w * partWH.w * field.h * partWH.h. Eg,
 * 3 columns * 1111 cells * 3 rows * 1111 cells = 3333 cells * 3333 cells = 11 108 889 cells.
 *
 * Number of bytes = number of cells * cellW / 8.
 *
 * See
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#understand_system_limits.
 */
export type GraphicsFieldConfig = {
  /** Number of bits per cell. */
  cellW: number
  /**
   * Columns and rows field is split into. Used for texture configuration but
   * implies field dimensions in cells.
   *
   * An additional texture is used for the sprite atlas. See
   * https://web3dsurvey.com/webgl2/parameters/MAX_TEXTURE_IMAGE_UNITS.
   */
  wh: WH
  /**
   * Partition dimensions in cells. Used for texture configuration but implies
   * implies field dimensions in cells. See
   * https://web3dsurvey.com/webgl2/parameters/MAX_TEXTURE_SIZE.
   */
  partWH: WH
}
