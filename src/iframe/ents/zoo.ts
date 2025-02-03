import {c2dClear} from '../canvas/c2d.ts'
import type {Game, PreloadGame} from '../game/game.ts'
import {type Layer, layerDrawOrder} from '../types/layer.ts'
import {CursorEnt} from './cursor-ent.ts'
import type {EID} from './eid.ts'
import type {Ent} from './ent.ts'

type EntByID = {[eid: EID]: Ent}
type EntsByLayer = {[layer in Layer]: EntByID}

// doesn't handle composed ents. those are handled by the owning ent.
export class Zoo {
  #entsByLayer: Readonly<EntsByLayer> = EntsByLayer()

  add(...ents: readonly Readonly<Ent>[]): void {
    for (const ent of ents) {
      this.#entsByLayer[ent.layer][ent.eid] = ent
    }
  }

  clear(): void {
    this.#entsByLayer = EntsByLayer()
  }

  cursor(): CursorEnt | undefined {
    // Assume only the cursor is on the cursor layer.
    const cursor = Object.values(this.#entsByLayer.Cursor)[0]
    return cursor instanceof CursorEnt ? cursor : undefined
  }

  draw(game: PreloadGame): void {
    if (!game.c2d) return
    c2dClear(game.c2d, game.cam)
    for (const layer of layerDrawOrder) {
      game.c2d.save()
      if (layer !== 'Cursor' && layer !== 'Level' && !layer.startsWith('UI'))
        game.c2d.translate(-game.cam.x, -game.cam.y)

      for (const ent of Object.values(this.#entsByLayer[layer]))
        ent.draw?.(game as Game)

      game.c2d.restore()
    }
  }

  find(eid: EID): Ent | undefined {
    for (const layer in this.#entsByLayer)
      if (this.#entsByLayer[layer as Layer][eid])
        return this.#entsByLayer[layer as Layer][eid]
  }

  update(game: PreloadGame): void {
    for (const ent of this.ents('Reverse')) ent.update?.(game as Game)
  }

  remove(...ents: readonly Readonly<Ent>[]): void {
    for (const ent of ents) {
      for (const layer of Object.values(this.#entsByLayer)) {
        if (!layer[ent.eid]) continue
        delete layer[ent.eid]
        break
      }
    }
  }

  *ents(dir: 'Forward' | 'Reverse' = 'Forward'): Generator<Ent> {
    const order =
      dir === 'Reverse' ? toReversed(layerDrawOrder) : layerDrawOrder
    for (const layer of order)
      for (const ent of Object.values(this.#entsByLayer[layer])) yield ent
  }
}

function EntsByLayer(): EntsByLayer {
  return Object.fromEntries(
    layerDrawOrder.map(layer => [layer, {}]),
  ) as EntsByLayer
}

function toReversed<T>(arr: readonly T[]): T[] {
  const reversed = []
  for (let i = arr.length; i; i--) reversed.push(arr[i - 1]!)
  return reversed
}
