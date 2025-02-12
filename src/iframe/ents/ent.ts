import type {Game} from '../game/game.ts'
import type {EID} from './eid.ts'

export type Ent = {
  readonly eid: EID
  draw?(game: Readonly<Game>): void
  /** Called before draw(). */
  update?(game: Game): void
}
