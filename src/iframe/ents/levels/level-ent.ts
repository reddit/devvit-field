import type {Game} from '../../game/game.ts'
import type {Ent} from '../ent.ts'

export type LevelEnt = Ent & {
  /**
   * Called (one or more times) before rendering by constructing agent. Modifies
   * zoo.
   */
  init?(game: Game): void | Promise<void>
}
