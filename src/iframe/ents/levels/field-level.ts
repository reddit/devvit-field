import {boxHits} from '../../../shared/types/2d.ts'
import type {FieldSub} from '../../../shared/types/field.ts'
import {audioPlay} from '../../audio.ts'
import type {Game} from '../../game/game.ts'
import {RealtimeConnector} from '../../realtime-connector.ts'
import {CursorEnt} from '../cursor-ent.ts'
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
    game.zoo.add(this, new CursorEnt(game))

    if (!game.audio) throw Error('no audio')
    if (game.sub?.includes('BananaField' satisfies FieldSub))
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
      ctrl.isOnStart('A') &&
      !ctrl.drag &&
      !ctrl.pinch &&
      !ctrl.handled &&
      boxHits(fieldConfig.wh, select)
    ) {
      // to-do: I broke the trailing edge of drag. It should stay on one extra
      //        cycle. This was an issue when trying to use isOffStart().
      ctrl.handled = true
      game.selectBox(select)
    }
  }

  #updatePosition(game: Game): void {
    const {cam, ctrl} = game

    if (ctrl.drag && !ctrl.handled) {
      ctrl.handled = true

      cam.x -= ctrl.delta.x / cam.scale / cam.fieldScale
      cam.y -= ctrl.delta.y / cam.scale / cam.fieldScale

      this.#rtConnector.update(game)
    }

    if (game.ctrl.isAnyOn('L', 'R', 'U', 'D') && !ctrl.handled) {
      ctrl.handled = true

      const dir = {x: 0, y: 0}
      if (ctrl.isOn('L')) dir.x--
      if (ctrl.isOn('R')) dir.x++
      if (ctrl.isOn('U')) dir.y--
      if (ctrl.isOn('D')) dir.y++

      const speed =
        (dir.x && dir.y ? Math.sqrt(25 / 2) : 5) / cam.scale / cam.fieldScale
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
