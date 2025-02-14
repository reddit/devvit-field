import type {XY} from '../../shared/types/2d.ts'
import type {Game} from '../game/game.ts'
import type {Atlas, TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {Sprite} from '../graphics/sprite.ts'
import {fontCharToTag} from './font.ts'
import memProp5x6 from './mem-prop-5x6.json' with {type: 'json'}
import {layoutText} from './text-layout.ts'

export class Text<T extends TagFormat> {
  text: string = ''
  maxW: number = 999 // to-do: 1) make 0 no max; 2) invalidate on change.
  #game: Game
  #rendered = ''
  #sprites: {origin: XY; sprite: Sprite<T>}[] = []

  constructor(game: Game) {
    this.#game = game
  }

  draw(): void {
    console.log('draw', this.#sprites)
    this.#game.bmps.push(...this.#sprites.map(char => char.sprite))
  }

  // to-do: this centers text currently. It should support moving to an XY by an
  //        anchor (NW, N, NE, etc).
  move(): void {
    for (const char of this.#sprites) {
      char.sprite.x =
        this.#game.cam.x + char.origin.x + this.#game.cam.w / 2 - this.maxW / 2
      char.sprite.y = this.#game.cam.y + char.origin.y + this.#game.cam.h / 2
    }
  }

  update(): void {
    if (this.text !== this.#rendered) {
      const layout = layoutText(memProp5x6, this.text, this.maxW)
      this.#sprites.length = 0
      for (const [i, char] of layout.chars.entries()) {
        if (char == null) continue
        const tag = fontCharToTag(memProp5x6, this.text[i]!) as T
        // to-do: reuse sprite on re-layout.
        const sprite = new Sprite<T>(this.#game.atlas as Atlas<T>, tag)
        sprite.z = Layer.UIFore
        this.#sprites.push({origin: {x: char.x, y: char.y}, sprite})
      }
    }
  }
}
