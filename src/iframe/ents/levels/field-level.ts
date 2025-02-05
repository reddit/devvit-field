import type {Tag} from '../../game/config.ts'
import type {Game} from '../../game/game.ts'
import {Sprite} from '../../graphics/sprite.ts'
import type {Layer} from '../../types/layer.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import type {LevelEnt} from './level-ent.ts'

export class FieldLevel implements LevelEnt {
  readonly eid: EID
  readonly layer: Layer = 'Level'
  #sprite!: Sprite<Tag>

  constructor(game: Game) {
    this.eid = game.eid.new()
  }

  draw(game: Readonly<Game>): void {
    game.bmps.push(this.#sprite)
  }

  init(game: Game): void {
    this.#sprite = new Sprite(game.atlas, 'background--Red')
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game))
  }

  update(_game: Game): void {}
}
