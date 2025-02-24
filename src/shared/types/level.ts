// NOTE: I don't put the level config in here since it's bundled
// to the client. We want the levels to be a surprise!

import type {T3, T5} from './tid'

/** The current level the user is on */
export type Level = 0 | 1 | 2 | 3 | 4

export type LevelConfig = {
  id: Level
  postId: T3
  subredditName: string
  subredditId: T5
  theme: Record<string, string>
}
