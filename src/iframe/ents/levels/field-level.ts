import type {Tag} from '../../game/config.ts'
import type {Game} from '../../game/game.ts'
import {Sprite} from '../../graphics/sprite.ts'
import {Layer} from '../../types/layer.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
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
  #sprite!: Sprite<Tag>
  #index: number

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#index = zoomLevels.indexOf(game.fieldScale)!
  }

  draw(game: Readonly<Game>): void {
    game.bmps.push(this.#sprite)
  }

  init(game: Game): void {
    this.#sprite = new Sprite(game.atlas, 'background--Red')
    this.#sprite.z = Layer.UIFore
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game))
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
  }
}
