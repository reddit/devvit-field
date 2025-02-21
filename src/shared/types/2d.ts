export type Box = XY & WH
export type WH = {w: number; h: number}
export type XY = {x: number; y: number}

export type PartitionKey = `px_${number}__py_${number}`
export type XYZ = {x: number; y: number; z: number}

export function boxHits(
  lhs: Readonly<Box>,
  rhs: Readonly<XY & Partial<WH>>,
): boolean {
  const rhsWH = {w: rhs.w ?? 1, h: rhs.h ?? 1} // Point? An empty box has no w/h.
  if (!lhs.w || !lhs.h || !rhsWH.w || !rhsWH.h) return false // Noncommutative.
  return (
    lhs.x < rhs.x + rhsWH.w &&
    lhs.x + lhs.w > rhs.x &&
    lhs.y < rhs.y + rhsWH.h &&
    lhs.y + lhs.h > rhs.y
  )
}

export function xyAdd(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: lhs.x + rhs.x, y: lhs.y + rhs.y}
}

export function xyDistance(from: Readonly<XY>, to: Readonly<XY>): number {
  return xyMagnitude(xySub(from, to))
}

export function xyEq(lhs: Readonly<XY>, rhs: Readonly<XY>): boolean {
  return lhs.x === rhs.x && lhs.y === rhs.y
}

export function xyMagnitude(xy: Readonly<XY>): number {
  return Math.sqrt(xy.x * xy.x + xy.y * xy.y)
}

export function xySub(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: lhs.x - rhs.x, y: lhs.y - rhs.y}
}
