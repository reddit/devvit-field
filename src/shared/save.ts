import type {Level} from './types/level.ts'
import type {Seed} from './types/random.ts'
import type {SID} from './types/sid.ts'
import type {T2} from './types/tid.ts'

/** Immutable R2 user data. */
export type Profile = {
  /** True if sub moderator or employee. */
  superuser: boolean
  /** Player user ID. t2_0 for anons. */
  t2: T2
  /** Player username. eg, spez. */
  username: string
  /** The level the user is currently on */
  currentLevel: Level
  /**
   * The last challenge the user has submitted a click for. Used for verifying access control
   * when paired with currentLevel
   */
  lastPlayedChallengeNumberForLevel: number
  /** The cells claimed for the last challenge number. Placed here to disperse writes. We also do not need a user level leaderboard per challenge */
  lastPlayedChallengeNumberCellsClaimed: number
  /** Does the user have a verified email  */
  hasVerifiedEmail: boolean
  /** Is the user permanently blocked from playing. Will be a UTC date string if defined of the time they've been banned */
  blocked?: string
  /** Has the user claimed a global point. A global point is also known as "cycling" */
  globalPointCount: number
  /** The date the user first claimed a square. Will be a UTC date string if defined of the time they've been banned */
  startedPlayingAt?: string
}

export type Player = {profile: Profile; sid: SID}

/**
 * Makes a random seed for a new challenge.
 */
export function makeRandomSeed() {
  // Assume positive 32b numbers are ok; ints in [1, 0x7fff_ffff].
  return (1 + Math.trunc(Math.random() * 0x7fff_ffff)) as Seed
}
