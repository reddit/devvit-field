import type {Team} from '../team'
import type {XY} from './2d'

export type Delta = {
  globalXY: XY
  isBan: boolean
  team: Team
}
