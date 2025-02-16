import type {Game} from '../../game/game.ts'
import type {EID} from '../eid.ts'
import type {LevelEnt} from './level-ent.ts'

export class FieldLevel implements LevelEnt {
  readonly eid: EID

  constructor(game: Game) {
    this.eid = game.eid.new()
  }

  draw(_game: Readonly<Game>): void {}

  init(game: Game): void {
    game.zoo.clear()
    game.zoo.add(this)
  }

  update(game: Game): void {
    if (game.ctrl.wheel.y)
      game.cam.zoomField(
        game.ctrl.wheel.y > 0 ? 'Out' : 'In',
        !!game.p1?.profile.superuser,
      )
    if (!game.ctrl.handled && game.ctrl.isOffStart('A') && !game.ctrl.drag) {
      game.ctrl.handled = true
      // to-do: move this mutation to a centralized store or Game so it's easier
      //        to see how state changes.
      const xy = {
        x: Math.trunc(
          game.cam.x + game.ctrl.screenPoint.x / game.cam.fieldScale,
        ),
        y: Math.trunc(
          game.cam.y + game.ctrl.screenPoint.y / game.cam.fieldScale,
        ),
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

      game.postMessage({type: 'ClaimBoxes', boxes: [xy]})
    }
    if (!game.ctrl.handled && game.ctrl.drag) {
      game.ctrl.handled = true
      game.cam.x = game.cam.x - game.ctrl.delta.x / game.cam.fieldScale
      game.cam.y = game.cam.y - game.ctrl.delta.y / game.cam.fieldScale
    }
  }
}
