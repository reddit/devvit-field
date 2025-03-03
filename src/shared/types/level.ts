// NOTE: I don't put the level config in here since it's bundled
// to the client. We want the levels to be a surprise!

import type {T5} from './tid'

/** The current level the user is on */
export type Level = 0 | 1 | 2 | 3 | 4
export type LevelPascalCase =
  | 'Field'
  | 'BannedField'
  | 'VeryBannedField'
  | 'BananaField'
  | 'WhatIsField'

export type BanFieldConfig = {
  /** Path to Devvit config file from root of repo. Eg, 'devvit.dev.yaml'. */
  devvitConfig: string
  levels: LevelConfig[]
}

export type LevelConfig = {
  id: Level
  url: string
  subredditName: string
  subredditId: T5
  theme: Record<string, string>
  /** Post title. */
  title: string
}

/** PascalCase level name. */
export const levelPascalCase: {readonly [lvl in Level]: LevelPascalCase} = {
  0: 'Field',
  1: 'BannedField',
  2: 'VeryBannedField',
  3: 'BananaField',
  4: 'WhatIsField',
}

/** Unique first word for each level. */
export const levelWord = {
  0: 'Field',
  1: 'Banned',
  2: 'Very',
  3: 'Banana',
  4: 'What',
} as const
