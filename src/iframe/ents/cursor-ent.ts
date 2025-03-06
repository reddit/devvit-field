import {type Box, type WH, type XY, boxHits} from '../../shared/types/2d.js'
import type {Tag} from '../game/config.js'
import type {Game} from '../game/game.js'
import {Layer} from '../graphics/layer.js'
import {Sprite} from '../graphics/sprite.js'
import type {EID} from './eid.js'
import type {Ent} from './ent.js'

// to-do: move to Aseprite slice.
const hitbox: Readonly<Box> = {x: 0, y: 0, w: 1, h: 1}

export class CursorEnt implements Ent {
  readonly eid: EID
  #sprite: Sprite<Tag>
  #visible: boolean = false

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#sprite = new Sprite(game.atlas, 'background--Checkerboard') // 'cursor--Point'
    this.#sprite.z = Layer.Cursor
  }

  draw(game: Readonly<Game>): void {
    if (!this.#visible) return
    game.bmps.push(this.#sprite)
  }

  hitbox(game: Readonly<Game>, coords: 'Level' | 'Client'): Box {
    const {cam, ctrl} = game
    const lvl = coords === 'Level'
    if (!this.#visible) {
      // to-do: how to correlate with innerWidth * devicePixelRatio? should this
      //        be in Pointer.clientPoint?
      // to-do: is client point right here? not screen point?
      const x = lvl ? ctrl.point.x : ctrl.clientPoint.x * devicePixelRatio
      const y = lvl ? ctrl.point.y : ctrl.clientPoint.y * devicePixelRatio
      return {
        x: x - hitbox.w / 2,
        y: y - hitbox.h / 2,
        w: hitbox.w,
        h: hitbox.h,
      }
    }
    return {
      x: this.#sprite.x + (lvl ? cam.x : 0) + hitbox.x,
      y: this.#sprite.y + (lvl ? cam.y : 0) + hitbox.y,
      w: hitbox.w,
      h: hitbox.h,
    }
  }

  hits(
    game: Readonly<Game>,
    box: Readonly<XY & Partial<WH>>,
    coords: 'Level' | 'Client',
  ): boolean {
    // to-do: use this.#sprite.hits()?
    return boxHits(this.hitbox(game, coords), box)
  }

  update(game: Game): void {
    const {ctrl} = game

    if (ctrl.pointOn && ctrl.pointType === 'Mouse') {
      // this.#visible = true
    } else if (
      // to-do: make it possible to detect keyboard distinctly.
      ctrl.isAnyOn('L', 'R', 'U', 'D') ||
      ctrl.pointType !== 'Mouse'
    )
      this.#visible = false

    this.#sprite.x =
      Math.round(ctrl.screenPoint.x) - Math.trunc(hitbox.x + hitbox.w / 2)
    this.#sprite.y =
      Math.round(ctrl.screenPoint.y) - Math.trunc(hitbox.y + hitbox.h / 2)
  }
}
