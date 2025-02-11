import type {Game} from '../../game/game.ts'
import type {Layer} from '../../types/layer.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import {ToolbeltEnt} from '../toolbelt.ts'
import type {LevelEnt} from './level-ent.ts'

// It'd probably be better to use an exponential here but this was easier at the
// cost of index state, Integers above 1 and tenths below.
const zoomLevels: readonly number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 54, 58, 62, 66, 70, 78, 86, 94,
  102, 118, 134, 150, 166, 198, 230, 262, 294, 358, 422, 486, 1000, 2000, 3000,
  4000, 5000, 10_000, 100_000,
]

export class FieldLevel implements LevelEnt {
  readonly eid: EID
  readonly layer: Layer = 'Level'
  #index: number

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#index = zoomLevels.indexOf(game.fieldScale)!
  }

  draw(_game: Readonly<Game>): void {}

  init(game: Game): void {
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game), new ToolbeltEnt(game))
  }

  update(game: Game): void {
    if (game.ctrl.wheel.y) {
      this.#index = Math.max(
        0,
        Math.min(
          zoomLevels.length - 1,
          this.#index - Math.sign(game.ctrl.wheel.y),
        ),
      )
      game.fieldScale = zoomLevels[this.#index]!
    }
    if (!game.ctrl.handled && game.ctrl.isOnStart('A')) {
      game.ctrl.handled = true
      // to-do: move this mutation to a centralized store or Game so it's easier
      //        to see how state changes.
      const xy = {
        x: Math.trunc(game.ctrl.point.x / game.fieldScale),
        y: Math.trunc(game.ctrl.point.y / game.fieldScale),
      }
      game.field[xy.y * game.fieldConfig!.wh.w + xy.x] = 1
      game.renderer.setCell(xy, 1)
      // to-do: post message.
      // to-do: set state to indeterminate and wait until response to mark
      //        state. Aggregate clicks while waiting.
      if (!game.renderer.hasContext()) return
    }
  }
}
