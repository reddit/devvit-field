import {AssetMap, PreloadAssetMap} from '../../asset-map.ts'
import {Audio} from '../../audio.ts'
import type {C2D} from '../../canvas/c2d.ts'
import type {LoadedGame, PreloadGame} from '../../game/game.ts'
import type {Layer} from '../../types/layer.ts'
import type {EID} from '../eid.ts'
import {FieldLevel} from './field-level.ts'
import type {LevelEnt} from './level-ent.ts'

/**
 * Loading sequence is:
 * - Devvit <Preview>.
 * - Devvit <webview>.
 * - index.html is loaded; JavaScript and asset fetches are queued. HTML and CSS
 *   can show whatever is wanted.
 * - JavaScript is loaded; LoadLevel.init() started. Still showing HTML and CSS.
 * - LoadLevel.init() is loaded; FieldLevel.init() started. Loading screen is
 *   shown.
 * - FieldLevel.init() is loaded including InitDevvitMessage. Game is ready.
 */
export class LoadingLevel implements LevelEnt {
  readonly eid: EID
  readonly layer: Layer = 'Level'
  #assets?: PreloadAssetMap
  readonly #field: FieldLevel

  constructor(game: PreloadGame) {
    this.eid = game.eid.new()
    this.#field = new FieldLevel(game)
  }

  draw(game: Readonly<PreloadGame & {c2d: C2D}>): void {
    if (!this.#assets) return // init() adds level to zoo before loading ends.

    game.c2d.drawImage(this.#assets.loading, 0, 0)
    // to-do: show error when assets or field cannot be loaded.
  }

  async init(game: PreloadGame): Promise<void> {
    // Config zoo before starting next level initialization which also configs
    // the zoo.
    game.zoo.clear()
    game.zoo.add(this)

    const preload = PreloadAssetMap() // Initiate preload first.
    void this.#load(game) // Don't wait for preload to finish.
    this.#assets = await preload
    console.log('preloaded')
  }

  async #load(game: PreloadGame | LoadedGame): Promise<void> {
    const assets = await AssetMap()
    document.fonts.add(assets.font)
    const loaded = game as LoadedGame
    loaded.audio = await Audio(assets)
    loaded.img = assets.img
    loaded.looper.initTextures(assets)

    await game.init

    this.#field.init(game)
  }
}
