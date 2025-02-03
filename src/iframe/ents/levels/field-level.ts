import type {Game, LoadedGame, PreloadGame} from '../../game/game.ts'
import type {Layer} from '../../types/layer.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import type {LevelEnt} from './level-ent.ts'

declare global {
  // hack: fix type.
  interface FontFaceSet {
    add(font: FontFace): FontFaceSet
  }
}

export class FieldLevel implements LevelEnt {
  readonly eid: EID
  readonly layer: Layer = 'Level'

  constructor(game: PreloadGame) {
    this.eid = game.eid.new()
  }

  draw(game: Readonly<Game>): void {
    game.c2d.fillStyle = game.textures.bg
    game.c2d.fillRect(0, 0, game.cam.w, game.cam.h)
  }

  init(game: LoadedGame): void {
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game))
  }

  update(_game: Game): void {}
}
