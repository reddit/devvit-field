import type {Game} from '../game/game.ts'
import type {Layer} from '../types/layer.ts'
import type {EID} from './eid.ts'

export type Ent = {
  readonly eid: EID
  readonly layer: Layer
  draw?(game: Readonly<Game>): void
  /** Called before draw(). */
  update?(game: Game): void
}
