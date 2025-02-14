import type {Tag} from '../../game/config.ts'
import type {Game} from '../../game/game.ts'
import {Layer} from '../../graphics/layer.ts'
import {Sprite} from '../../graphics/sprite.ts'
import {Text} from '../../text/text.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import {FieldLevel} from './field-level.ts'
import type {LevelEnt} from './level-ent.ts'

export class WelcomeLevel implements LevelEnt {
  readonly eid: EID
  readonly #bg: Sprite<Tag>
  #text: Text<Tag>

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#bg = new Sprite(game.atlas, 'background--White')
    this.#bg.z = Layer.Default
    this.#text = new Text(game)
    this.#text.maxW = 80
    this.#text.text = 'Welcome to r/DontPlayBanfield #003' // to-do: get from init.
  }

  draw(game: Readonly<Game>): void {
    game.bmps.push(this.#bg)
    this.#text.draw()
  }

  init(game: Game): void {
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game))
    this.#updateBg(game)
    this.#text.update()
    this.#text.move()
  }

  update(game: Game): void {
    if (!game.cam.valid) {
      this.#updateBg(game)
      this.#text.update()
      this.#text.move()
    }

    if (!game.ctrl.handled && game.ctrl.isOffStart('A')) {
      const field = new FieldLevel(game)
      field.init(game)
    }
  }

  #updateBg(game: Game) {
    this.#bg.x = game.cam.x
    this.#bg.y = game.cam.y
    this.#bg.w = game.cam.w
    this.#bg.h = game.cam.h
  }
}
