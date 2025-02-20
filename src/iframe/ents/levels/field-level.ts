import type {FieldSub} from '../../../shared/types/field.ts'
import {audioPlay} from '../../audio.ts'
import type {Game} from '../../game/game.ts'
import type {EID} from '../eid.ts'
import type {LevelEnt} from './level-ent.ts'

export class FieldLevel implements LevelEnt {
  readonly eid: EID
  #zoomLvl: number

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#zoomLvl = game.cam.fieldScale
  }

  draw(_game: Readonly<Game>): void {}

  init(game: Game): void {
    game.zoo.clear()
    game.zoo.add(this)

    if (!game.audio) throw Error('no audio')
    if (game.sub === ('BananaField' satisfies FieldSub))
      audioPlay(
        game.ac,
        game.audio['16ItemsInThe15OrLessAtA60sGroceryStore'],
        true,
        true,
      )
  }

  update(game: Game): void {
    const {cam, ctrl, fieldConfig, p1} = game
    if (ctrl.wheel.y) {
      this.#zoomLvl += ctrl.wheel.y > 0 ? -1 : 1
      cam.setFieldScaleLevel(
        this.#zoomLvl,
        ctrl.screenPoint,
        !!p1?.profile.superuser,
      )
    }

    if (ctrl.pinch) {
      ctrl.handled = true
      cam.setFieldScaleLevel(
        this.#zoomLvl + Math.trunc(ctrl.pinch / 50),
        ctrl.screenPoint,
        !!p1?.profile.superuser,
      )
    } else this.#zoomLvl = cam.fieldScaleLevel

    if (!ctrl.handled && ctrl.isOffStart('A') && !ctrl.drag && !ctrl.pinch) {
      ctrl.handled = true
      // to-do: move this mutation to a centralized store or Game so it's easier
      //        to see how state changes.
      const xy = {
        x: Math.trunc(cam.x + ctrl.screenPoint.x / cam.fieldScale),
        y: Math.trunc(cam.y + ctrl.screenPoint.y / cam.fieldScale),
      }
      if (
        xy.x < 0 ||
        xy.x >= fieldConfig!.wh.w ||
        xy.y < 0 ||
        xy.y >= fieldConfig!.wh.h
      )
        return
      // to-do: post message.
      // to-do: set state to indeterminate and wait until response to mark
      //        state. Aggregate clicks while waiting.

      game.postMessage({type: 'ClaimBoxes', boxes: [xy]})
    }
    if (!ctrl.handled && ctrl.drag) {
      ctrl.handled = true
      cam.x = cam.x - ctrl.delta.x / cam.fieldScale
      cam.y = cam.y - ctrl.delta.y / cam.fieldScale
    }
  }
}
