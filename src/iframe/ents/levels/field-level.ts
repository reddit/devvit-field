import {boxHits} from '../../../shared/types/2d.ts'
import {mapSize} from '../../../shared/types/app-config.ts'
import type {LevelPascalCase} from '../../../shared/types/level.ts'
import {audioPlayMusic} from '../../audio.ts'
import type {Game} from '../../game/game.ts'
import {RealtimeConnector} from '../../realtime-connector.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import {ReticleEnt} from '../reticle-ent.ts'
import type {LevelEnt} from './level-ent.ts'

export class FieldLevel implements LevelEnt {
  readonly eid: EID
  readonly #rtConnector: RealtimeConnector = new RealtimeConnector()
  #zoomLvl: number

  constructor(game: Game) {
    this.eid = game.eid.new()
    this.#zoomLvl = game.cam.fieldScale
  }

  init(game: Game): void {
    if (game.subLvl == null) throw Error('no sub level')
    game.zoo.clear()
    game.zoo.add(this, new CursorEnt(game), new ReticleEnt(game, game.subLvl))

    if (!game.audio) throw Error('no audio')
    if (game.sub?.includes('BananaField' satisfies LevelPascalCase))
      audioPlayMusic(
        game.ac,
        game.audio['16ItemsInThe15OrLessAtA60sGroceryStore'],
        true,
        true,
      )
    this.#rtConnector.update(game)
  }

  update(game: Game): void {
    this.#updatePosition(game)
    this.#updateZoom(game)
    this.#updatePick(game)
  }

  #updatePick(game: Game): void {
    const {cam, ctrl, fieldConfig} = game
    if (!fieldConfig) return
    const scaledMapSize = mapSize * devicePixelRatio

    if (
      fieldConfig &&
      !ctrl.pinch &&
      !ctrl.handled &&
      (ctrl.isOnStart('A') || ctrl.drag) &&
      boxHits({w: scaledMapSize, h: scaledMapSize}, ctrl.screenStartPoint)
    ) {
      ctrl.handled = true

      const xy = {
        x: Math.max(
          0,
          Math.min(
            fieldConfig.wh.w - 1,
            Math.floor((ctrl.screenPoint.x * fieldConfig.wh.w) / scaledMapSize),
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            fieldConfig.wh.h - 1,
            Math.floor((ctrl.screenPoint.y * fieldConfig.wh.h) / scaledMapSize),
          ),
        ),
      }

      game.selectBox(xy)
      game.centerBox(xy)
      return
    }

    // Use floor, not trunc. when out of bounds, do truncate back to inbounds.
    const select = {
      x: Math.floor(
        cam.x / cam.scale + ctrl.screenPoint.x / cam.scale / cam.fieldScale,
      ),
      y: Math.floor(
        cam.y / cam.scale + ctrl.screenPoint.y / cam.scale / cam.fieldScale,
      ),
    }

    if (
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
    const {cam, ctrl, fieldConfig} = game
    const scaledMapSize = mapSize * devicePixelRatio

    if (
      fieldConfig &&
      ctrl.drag &&
      !ctrl.handled &&
      !boxHits({w: scaledMapSize, h: scaledMapSize}, ctrl.screenStartPoint)
    ) {
      ctrl.handled = true

      game.moveTo({
        x: cam.x - ctrl.delta.x / cam.scale / cam.fieldScale,
        y: cam.y - ctrl.delta.y / cam.scale / cam.fieldScale,
      })

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
      game.moveTo({x: cam.x + dir.x * speed, y: cam.y + dir.y * speed})

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
      // to-do: centralize cam movements.
      game.moveTo(game.cam)

      this.#rtConnector.update(game)
    }

    if (game.ctrl.pinch && !game.ctrl.handled) {
      game.ctrl.handled = true

      game.cam.setFieldScaleLevel(
        this.#zoomLvl + Math.trunc(game.ctrl.pinch / 50),
        game.ctrl.screenMidPoint,
        !!game.p1?.profile.superuser,
      )
      game.moveTo(game.cam)

      this.#rtConnector.update(game)
    } else this.#zoomLvl = game.cam.fieldScaleLevel
  }
}
