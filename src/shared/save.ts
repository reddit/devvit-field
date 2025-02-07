import type {Seed} from './types/random.ts'
import type {SID} from './types/sid.ts'
import {type T2, type T3, noT2, noUsername} from './types/tid.ts'
import type {UTCMillis} from './types/time.ts'

export type PostSeed = {seed: Seed}

export type PostSave = {
  /** Original poster. */
  author: T2
  /** Post creation timestamp. */
  created: UTCMillis
  seed: PostSeed
  t3: T3
}

/** Immutable R2 user data. */
export type Profile = {
  /** Player user ID. t2_0 for anons. */
  t2: T2
  /** Player username. eg, spez. */
  username: string
}

export type Player = {profile: Profile; sid: SID}

export function PostSave(
  post: {readonly authorId: T2 | undefined; readonly createdAt: Date; id: T3},
  seed: Readonly<PostSeed>,
): PostSave {
  if (!post.authorId) throw Error('no T2 in post')
  return {
    author: post.authorId,
    created: post.createdAt.getUTCMilliseconds() as UTCMillis,
    seed,
    t3: post.id,
  }
}

/**
 * Makes a random seed for a new challenge.
 */
export function makeRandomSeed() {
  // Assume positive 32b numbers are ok; ints in [1, 0x7fff_ffff].
  return (1 + Math.trunc(Math.random() * 0x7fff_ffff)) as Seed
}

export function NoProfile(): Profile {
  return {t2: noT2, username: noUsername}
}
