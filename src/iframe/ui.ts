import {minCanvasWH} from '../shared/theme.ts'
import {camScale} from './renderer/cam.ts'

export function uiScale(canvas: HTMLCanvasElement, max: number = 4): number {
  return Math.min(max, camScale(canvas, minCanvasWH, 1, 0, 'Fraction')) / max
}
