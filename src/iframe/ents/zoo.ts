import type {Game} from '../game/game.ts'
import {CursorEnt} from './cursor-ent.ts'
import type {EID} from './eid.ts'
import type {Ent} from './ent.ts'

type EntByID = {[eid: EID]: Ent}

// doesn't handle composed ents. those are handled by the owning ent.
// ents are processed in insertion order.
export class Zoo {
  #cursor: CursorEnt | undefined
  #ents: EntByID = {}

  add(...ents: readonly Readonly<Ent>[]): void {
    for (const ent of ents) {
      this.#ents[ent.eid] = ent
      if (ent instanceof CursorEnt) this.#cursor = ent
    }
  }

  clear(): void {
    this.#cursor = undefined
    this.#ents = {}
  }

  get cursor(): CursorEnt | undefined {
    return this.#cursor
  }

  draw(game: Game): void {
    for (const ent of this.ents()) ent.draw?.(game as Game)
  }

  remove(...ents: readonly Readonly<Ent>[]): void {
    for (const ent of ents) {
      delete this.#ents[ent.eid]
      if (ent === this.#cursor) this.#cursor = undefined
    }
  }

  update(game: Game): void {
    for (const ent of this.ents()) ent.update?.(game as Game)
  }

  *ents(): Generator<Ent> {
    for (const ent of Object.values(this.#ents)) yield ent
  }
}
