import type {Game} from '../../game/game.ts'
import {CursorEnt} from '../cursor-ent.ts'
import {DashboardEnt} from '../dashboard.ts'
import type {EID} from '../eid.ts'
import type {LevelEnt} from './level-ent.ts'

// It'd probably be better to use an exponential here but this was easier at the
// cost of index state, Integers above 1 and tenths below.
const zoomLevels: readonly number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50,
]

const userMinZoom: number = zoomLevels.indexOf(10)!

export class FieldLevel implements LevelEnt {
  readonly eid: EID
  #index: number = userMinZoom

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#index = zoomLevels.indexOf(game.fieldScale)!
  }

  draw(_game: Readonly<Game>): void {}

  init(game: Game): void {
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game), new DashboardEnt(game))
  }

  update(game: Game): void {
    if (game.ctrl.wheel.y) {
      this.#index = Math.max(
        game.p1?.profile.superuser ? 0 : userMinZoom,
        Math.min(
          zoomLevels.length - 1,
          this.#index - Math.sign(game.ctrl.wheel.y),
        ),
      )

      const scale = zoomLevels[this.#index]!
      if (scale !== game.fieldScale) {
        const half = {w: game.cam.w / 2, h: game.cam.h / 2}
        game.cam.x += half.w / game.fieldScale - half.w / scale
        game.cam.y += half.h / game.fieldScale - half.h / scale
        game.fieldScale = scale
      }
    }
    if (!game.ctrl.handled && game.ctrl.isOffStart('A') && !game.ctrl.drag) {
      game.ctrl.handled = true
      // to-do: move this mutation to a centralized store or Game so it's easier
      //        to see how state changes.
      const xy = {
        x: Math.trunc(game.cam.x + game.ctrl.screenPoint.x / game.fieldScale),
        y: Math.trunc(game.cam.y + game.ctrl.screenPoint.y / game.fieldScale),
      }
      if (
        xy.x < 0 ||
        xy.x >= game.fieldConfig!.wh.w ||
        xy.y < 0 ||
        xy.y >= game.fieldConfig!.wh.h
      )
        return
      // to-do: post message.
      // to-do: set state to indeterminate and wait until response to mark
      //        state. Aggregate clicks while waiting.

      game.postMessage({type: 'ClaimCells', cells: [xy]})
    }
    if (!game.ctrl.handled && game.ctrl.drag) {
      game.ctrl.handled = true
      const wh = {
        w: game.fieldConfig?.wh.w ?? 0,
        h: game.fieldConfig?.wh.h ?? 0,
      }
      game.cam.x = Math.min(
        wh.w,
        Math.max(-wh.w, game.cam.x - game.ctrl.delta.x / game.fieldScale),
      )
      game.cam.y = Math.min(
        wh.h,
        Math.max(-wh.h, game.cam.y - game.ctrl.delta.y / game.fieldScale),
      )
    }
  }
}
