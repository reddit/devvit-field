import type {XY} from '../../../shared/types/2d.ts'
import type {Tag} from '../../game/config.ts'
import type {Game} from '../../game/game.ts'
import {Layer} from '../../graphics/layer.ts'
import {Sprite} from '../../graphics/sprite.ts'
import {fontCharToTag} from '../../text/font.ts'
import memProp5x6 from '../../text/mem-prop-5x6.json' with {type: 'json'}
import {layoutText} from '../../text/text-layout.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import {FieldLevel} from './field-level.ts'
import type {LevelEnt} from './level-ent.ts'

const textW: number = 80

export class WelcomeLevel implements LevelEnt {
  readonly eid: EID
  readonly #bg: Sprite<Tag>
  #text: {origin: XY; sprite: Sprite<Tag>}[] = []

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#bg = new Sprite(game.atlas, 'background--White')
    this.#bg.z = Layer.Default

    const str = 'Welcome to r/DontPlayBanfield #003'
    const layout = layoutText(memProp5x6, str, textW)
    this.#text.length = 0
    for (const [i, char] of layout.chars.entries()) {
      if (char == null) continue
      const tag = fontCharToTag(memProp5x6, str[i]!) as Tag
      const sprite = new Sprite(game.atlas, tag)
      sprite.z = Layer.UIFore
      this.#text.push({origin: {x: char.x, y: char.y}, sprite})
    }
  }

  draw(game: Readonly<Game>): void {
    game.bmps.push(this.#bg, ...this.#text.map(char => char.sprite))
  }

  init(game: Game): void {
    game.zoo.clear()
    // to-do: levels shouldn't add themselves, only children. The caller should
    //        add them.
    game.zoo.add(this, new CursorEnt(game))
    this.#updateBg(game)
    this.#updateText(game)
  }

  update(game: Game): void {
    if (!game.cam.valid) {
      this.#updateBg(game)
      this.#updateText(game)
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

  #updateText(game: Game) {
    for (const char of this.#text) {
      char.sprite.x = game.cam.x + char.origin.x + game.cam.w / 2 - textW / 2
      char.sprite.y = game.cam.y + char.origin.y + game.cam.h / 2
    }
  }
}
