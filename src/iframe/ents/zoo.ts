import type {Game} from '../game/game.ts'
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
    for (const ent of ents) this.#entsByLayer[ent.layer][ent.eid] = ent
  }

  clear(): void {
    this.#entsByLayer = EntsByLayer()
  }

  get cursor(): CursorEnt | undefined {
    // Assume only the cursor is on the cursor layer.
    const cursor = Object.values(this.#entsByLayer.Cursor)[0]
    return cursor instanceof CursorEnt ? cursor : undefined
  }

  draw(game: Game): void {
    for (const ent of this.ents()) ent.draw?.(game as Game)
  }

  remove(...ents: readonly Readonly<Ent>[]): void {
    for (const ent of ents) delete this.#entsByLayer[ent.layer][ent.eid]
  }

  update(game: Game): void {
    for (const ent of this.ents('Reverse')) ent.update?.(game as Game)
  }

  *ents(dir: 'Forward' | 'Reverse' = 'Forward'): Generator<Ent> {
    const order =
      dir === 'Reverse' ? layerDrawOrder.toReversed() : layerDrawOrder
    for (const layer of order)
      for (const ent of Object.values(this.#entsByLayer[layer])) yield ent
  }
}

function EntsByLayer(): EntsByLayer {
  return Object.fromEntries(
    layerDrawOrder.map(layer => [layer, {}]),
  ) as EntsByLayer
}
