import {type Level, levelWord} from '../../shared/types/level.js'
import type {Tag} from '../game/config.js'
import type {Game} from '../game/game.js'
import {Layer} from '../graphics/layer.js'
import {Sprite} from '../graphics/sprite.js'
import type {EID} from './eid.js'
import type {Ent} from './ent.js'

export class ReticleEnt implements Ent {
  readonly eid: EID
  readonly #sprite: Sprite<Tag>

  constructor(game: Game, lvl: Level) {
    this.eid = game.eid.new()
    const pascalLvl = levelWord[lvl]
    this.#sprite = new Sprite(game.atlas, `box--Reticle${pascalLvl}`)
    this.#sprite.z = Layer.UIFore
    this.#sprite.stretch = true
    this.#sprite.cel = game.looper.frame / 4
  }

  draw(game: Readonly<Game>): void {
    game.bmps.push(this.#sprite)
  }

  update(game: Game): void {
    const {cam} = game
    this.#sprite.x = (-cam.x + game.select.x) * cam.scale * cam.fieldScale
    this.#sprite.y = (-cam.y + game.select.y) * cam.scale * cam.fieldScale
    this.#sprite.w = this.#sprite.h = cam.fieldScale
  }
}
