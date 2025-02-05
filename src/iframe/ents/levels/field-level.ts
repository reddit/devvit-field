import {cssHex, paletteDark} from '../../../shared/theme.ts'
import {AssetMap} from '../../asset-map.ts'
import {Audio} from '../../audio.ts'
import type {Tag} from '../../game/config.ts'
import type {Game} from '../../game/game.ts'
import {Sprite} from '../../graphics/sprite.ts'
import type {Layer} from '../../types/layer.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import type {LevelEnt} from './level-ent.ts'

/**
 * Loading sequence is:
 * - Devvit <Preview>.
 * - Devvit <webview>.
 * - index.html is loaded; JavaScript and asset fetches are queued. HTML and CSS
 *   can show whatever is wanted.
 * - JavaScript is loaded; FieldLevel.init() started. Still showing HTML and
 *   CSS.
 * - FieldLevel.init() is loaded including InitDevvitMessage. Game is ready.
 */
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

  // to-do: this design doesn't seem to be working well now. We can just wait in Game and not split things up.
  async init(game: Game): Promise<void> {
    const assets = await AssetMap()

    game.audio = await Audio(assets)
    game.img = assets.img

    await game.init

    this.#sprite = new Sprite(game.atlas, 'background--Red')
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game))

    game.renderer.setAtlas(game.atlas, assets.img.atlas)

    document.body.style.background = cssHex(paletteDark)
    // Transition from invisible. No line height spacing.
    game.canvas.style.display = 'block'

    console.log('loaded')
  }

  update(_game: Game): void {}
}
