import type {Seed} from './types/random.ts'
import type {SID} from './types/sid.ts'
import type {T2} from './types/tid.ts'

/** Immutable R2 user data. */
export type Profile = {
  /** True if sub moderator or employee. */
  superuser?: boolean // to-do: make me required and fix all the errors.
  /** Player user ID. t2_0 for anons. */
  t2: T2
  /** Player username. eg, spez. */
  username: string
}

export type Player = {profile: Profile; sid: SID}

/**
 * Makes a random seed for a new challenge.
 */
export function makeRandomSeed() {
  // Assume positive 32b numbers are ok; ints in [1, 0x7fff_ffff].
  return (1 + Math.trunc(Math.random() * 0x7fff_ffff)) as Seed
}
