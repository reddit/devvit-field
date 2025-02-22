import {type Box, type WH, type XY, boxHits} from '../../shared/types/2d.js'
import type {Tag} from '../game/config.js'
import type {Game} from '../game/game.js'
import {Layer} from '../graphics/layer.js'
import {Sprite} from '../graphics/sprite.js'
import {
  fieldArrayIndex,
  fieldArraySetSelected,
} from '../renderer/field-array.js'
import type {EID} from './eid.js'
import type {Ent} from './ent.js'

// to-do: move to Aseprite slice.
const hitbox: Readonly<Box> = {x: 0, y: 0, w: 1, h: 1}

export class CursorEnt implements Ent {
  readonly eid: EID
  // to-do: providing the previous pointer position in Input would be handy.
  #select: XY = {x: 0, y: 0}
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
    const {cam, ctrl, fieldConfig} = game

    if (ctrl.pointOn && ctrl.pointType === 'Mouse') {
      // this.#visible = true
    } else if (
      // to-do: make it possible to detect keyboard distinctly.
      ctrl.isAnyOn('L', 'R', 'U', 'D') ||
      ctrl.pointType !== 'Mouse'
    )
      this.#visible = false

    const select = {
      x: Math.trunc(
        cam.x / cam.scale + ctrl.screenPoint.x / cam.scale / cam.fieldScale,
      ),
      y: Math.trunc(
        cam.y / cam.scale + ctrl.screenPoint.y / cam.scale / cam.fieldScale,
      ),
    }

    if (
      fieldConfig &&
      ctrl.isOffStart('A') &&
      !ctrl.drag &&
      !ctrl.pinch &&
      !ctrl.handled &&
      boxHits(fieldConfig.wh, select)
    ) {
      // to-do: I broke the trailing edge of drag. It should stay on one extra
      //        cycle.
      ctrl.handled = true

      // to-do: move this mutation to a centralized store or Game so it's easier
      //        to see how state changes.
      // to-do: set state to indeterminate and wait until response to mark
      //        state. Aggregate clicks while waiting.
      {
        const i = fieldArrayIndex(game.fieldConfig!, this.#select)
        fieldArraySetSelected(game.field, i, false)
        game.renderer.setBox(this.#select, game.field[i]!)
      }
      this.#select = select
      {
        const i = fieldArrayIndex(game.fieldConfig!, this.#select)
        fieldArraySetSelected(game.field, i, true)
        game.renderer.setBox(this.#select, game.field[i]!)
      }

      game.postMessage({type: 'ClaimBoxes', boxes: [select]})
    }

    this.#sprite.x =
      Math.round(ctrl.screenPoint.x) - Math.trunc(hitbox.x + hitbox.w / 2)
    this.#sprite.y =
      Math.round(ctrl.screenPoint.y) - Math.trunc(hitbox.y + hitbox.h / 2)
  }
}
