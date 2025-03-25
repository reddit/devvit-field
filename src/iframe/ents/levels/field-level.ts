import {consoleBorderW} from '../../../shared/theme.ts'
import {boxHits, xyAdd} from '../../../shared/types/2d.ts'
import type {LevelPascalCase} from '../../../shared/types/level.ts'
import {audioPlayMusic} from '../../audio.ts'
import type {Game} from '../../game/game.ts'
import {mapSize} from '../../ui.ts'
import {CursorEnt} from '../cursor-ent.ts'
import type {EID} from '../eid.ts'
import {ReticleEnt} from '../reticle-ent.ts'
import type {LevelEnt} from './level-ent.ts'

export class FieldLevel implements LevelEnt {
  readonly eid: EID
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
    const scaledBorderW = consoleBorderW * devicePixelRatio

    if (
      fieldConfig &&
      ctrl.pointOn &&
      !ctrl.pinch &&
      !ctrl.handled &&
      (ctrl.isOnStart('A') || ctrl.drag) &&
      boxHits(
        {
          w: scaledMapSize + 2 * scaledBorderW,
          h: scaledMapSize + 2 * scaledBorderW,
        },
        ctrl.screenStartPoint,
      )
    ) {
      ctrl.handled = true

      if (
        !boxHits(
          {
            x: scaledBorderW,
            y: scaledBorderW,
            w: scaledMapSize,
            h: scaledMapSize,
          },
          ctrl.screenStartPoint,
        )
      )
        return // Border.

      const xy = {
        x: Math.max(
          0,
          Math.min(
            fieldConfig.wh.w - 1,
            Math.floor(
              ((ctrl.screenPoint.x - scaledBorderW) * fieldConfig.wh.w) /
                scaledMapSize,
            ),
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            fieldConfig.wh.h - 1,
            Math.floor(
              ((ctrl.screenPoint.y - scaledBorderW) * fieldConfig.wh.h) /
                scaledMapSize,
            ),
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

    // to-do: allow passing in a device type. This isn't right because the
    //        player move the mouse while using the spacebar to trigger.
    if (
      ctrl.isOnStart('A') &&
      ctrl.pointOn &&
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

    if (
      ctrl.isOnStart('A') &&
      !ctrl.pointOn &&
      !ctrl.drag &&
      !ctrl.pinch &&
      !ctrl.handled
    ) {
      ctrl.handled = true
      game.claimBox({...game.select})
    }
  }

  #updatePosition(game: Game): void {
    const {cam, ctrl, fieldConfig} = game
    const scaledMapSize = mapSize * devicePixelRatio
    const scaledBorderW = consoleBorderW * devicePixelRatio

    if (
      fieldConfig &&
      ctrl.drag &&
      !ctrl.handled &&
      !boxHits(
        {
          w: scaledMapSize + 2 * scaledBorderW,
          h: scaledMapSize + 2 * scaledBorderW,
        },
        ctrl.screenStartPoint,
      )
    ) {
      ctrl.handled = true

      game.moveTo({
        x: cam.x - ctrl.delta.x / cam.scale / cam.fieldScale,
        y: cam.y - ctrl.delta.y / cam.scale / cam.fieldScale,
      })
    }

    if (game.ctrl.isAnyOn('L', 'R', 'U', 'D') && !ctrl.handled) {
      ctrl.handled = true

      const dir = {x: 0, y: 0}
      if (ctrl.isOnStart('L')) dir.x--
      if (ctrl.isOnStart('R')) dir.x++
      if (ctrl.isOnStart('U')) dir.y--
      if (ctrl.isOnStart('D')) dir.y++

      game.selectBox(xyAdd(game.select, dir))
      game.centerBox(game.select)
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
    }

    if (game.ctrl.pinch && !game.ctrl.handled) {
      game.ctrl.handled = true

      game.cam.setFieldScaleLevel(
        this.#zoomLvl + Math.trunc(game.ctrl.pinch / 50),
        game.ctrl.screenMidPoint,
        !!game.p1?.profile.superuser,
      )
      game.moveTo(game.cam)
    } else this.#zoomLvl = game.cam.fieldScaleLevel
  }
}
