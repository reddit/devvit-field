import type {FieldSub} from '../../../shared/types/field.ts'
import {audioPlay} from '../../audio.ts'
import type {Game} from '../../game/game.ts'
import {RealtimeConnector} from '../../realtime-connector.ts'
import type {EID} from '../eid.ts'
import type {LevelEnt} from './level-ent.ts'

export class FieldLevel implements LevelEnt {
  readonly eid: EID
  #rtConnector: RealtimeConnector = new RealtimeConnector()
  #zoomLvl: number

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#zoomLvl = game.cam.fieldScale
  }

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

    this.#rtConnector.update(game)
  }

  update(game: Game): void {
    this.#updatePick(game)
    this.#updatePosition(game)
    this.#updateZoom(game)
  }

  #updatePick(game: Game): void {
    const {cam, ctrl, fieldConfig} = game
    if (ctrl.isOffStart('A') && !ctrl.drag && !ctrl.pinch && !ctrl.handled) {
      // to-do: I broke the trailing edge of drag. It should stay on one extra
      //        cycle.
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
  }

  #updatePosition(game: Game): void {
    const {cam, ctrl} = game

    if (ctrl.drag && !ctrl.handled) {
      ctrl.handled = true

      cam.x -= ctrl.delta.x / cam.fieldScale
      cam.y -= ctrl.delta.y / cam.fieldScale

      this.#rtConnector.update(game)
    }

    if (game.ctrl.isAnyOn('L', 'R', 'U', 'D') && !ctrl.handled) {
      ctrl.handled = true

      const dir = {x: 0, y: 0}
      if (ctrl.isOn('L')) dir.x--
      if (ctrl.isOn('R')) dir.x++
      if (ctrl.isOn('U')) dir.y--
      if (ctrl.isOn('D')) dir.y++

      const speed = (dir.x && dir.y ? Math.sqrt(25 / 2) : 5) / cam.fieldScale
      cam.x += dir.x * speed
      cam.y += dir.y * speed

      this.#rtConnector.update(game)
    }
  }

  #updateZoom(game: Game): void {
    if (game.ctrl.wheel.y && !game.ctrl.handled) {
      game.ctrl.handled = true

      this.#zoomLvl += -Math.sign(game.ctrl.wheel.y)
      game.cam.setFieldScaleLevel(
        this.#zoomLvl,
        game.ctrl.screenPoint,
        !!game.p1?.profile.superuser,
      )

      this.#rtConnector.update(game)
    }

    if (game.ctrl.pinch && !game.ctrl.handled) {
      game.ctrl.handled = true

      game.cam.setFieldScaleLevel(
        this.#zoomLvl + Math.trunc(game.ctrl.pinch / 50),
        game.ctrl.midScreenPoint,
        !!game.p1?.profile.superuser,
      )

      this.#rtConnector.update(game)
    } else this.#zoomLvl = game.cam.fieldScaleLevel
  }
}
