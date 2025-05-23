// to-do: what broke when doing divisional shifting to get 53b access? maybe the
// 32b sign bit was cumbersome?
// to-do: will levels support negative XY?
export type Bmp = {
  /** x: i32; 8x fixed-point, 1b sign, 28b int, 3b fraction. */
  readonly _x: number
  /** y: i32; 8x fixed-point, 1b sign, 28b int, 3b fraction. */
  readonly _y: number
  /** w: u12, h: u12 */
  readonly _wh: number
  /** id+cel: u15; 16 cels, stretch: b1, flipX: b1, flipY: b1, zend: b1, z: u3 .*/
  readonly _isffzz: number
}

// I could allocate this all in a big array. transfer the full array every frame regardless of screen position. hold a reference in sprite. no copying then
// and finer tuning on size and easier bit operations. deleting is expensive. don't need the class wrapper if all state is in the array.
// could just set dead sprites to offscreen coordinates / dead flag but then allocating requires a search.
// I just don't want to have to copy to buffer
