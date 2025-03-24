import {minCanvasWH} from '../shared/theme.ts'
import {camScale} from './renderer/cam.ts'

export function uiScale(canvas: HTMLCanvasElement, max: number = 4): number {
  return Math.min(max, camScale(canvas, minCanvasWH, 1, 0, 'Fraction')) / max
}

/** Number of boxes per side of the minimap. */
export const mapSize: number =
  // Hack: this should use element dimensions and be reevaluated every frame.
  Math.min(innerWidth, innerHeight) < 360 ? 90 : 120
