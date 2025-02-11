import type {Tag} from '../game/config.js'
import type {Game} from '../game/game.js'
import {Sprite} from '../graphics/sprite.js'
import {Layer} from '../types/layer.js'
import type {EID} from './eid.js'
import type {Ent} from './ent.js'

export class ToolbeltEnt implements Ent {
  readonly eid: EID
  readonly layer: Layer = 'Cursor'
  #black: Sprite<Tag>
  #fade: Sprite<Tag>
  hidden: boolean = false

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#black = new Sprite(game.atlas, 'background--Black')
    this.#black.h = 100
    this.#black.x = this.#black.y = 0
    this.#black.z = Layer.UIBack
    this.#fade = new Sprite(game.atlas, 'background--Fade')
    this.#fade.h = 32
    this.#fade.x = 0
    this.#fade.y = this.#black.h
    this.#fade.z = Layer.UIBack
  }

  draw(game: Readonly<Game>): void {
    if (this.hidden) return
    game.bmps.push(this.#black, this.#fade)
  }

  update(game: Game): void {
    this.#black.w = this.#fade.w = game.cam.w
    game.ctrl.handled ||= !!game.zoo.cursor?.hits(game, this.#black, 'Client')
  }
}
