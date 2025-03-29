// to-do: Uncomment me for prod!!
//import configRaw from '../config/config.prod.json'
import configRaw from '../config/config.dev.json'
import {
  paletteBananaField,
  paletteBananaFieldDark,
  paletteBananaFieldLight,
  paletteBannedField,
  paletteBannedFieldDark,
  paletteBannedFieldLight,
  paletteField,
  paletteFieldDark,
  paletteFieldLight,
  paletteWhatIsField,
  paletteWhatIsFieldDark,
  paletteWhatIsFieldLight,
} from '../theme'
// to-do: Make sure we don't spoil the levels in the client bundle by getting the colors here.
import type {T3, T5} from './tid'

/** The current level the user is on */
export type Level = 0 | 1 | 2 | 3

/**
 * Field level / subreddit enumeration. Doesn't include r/ prefix. Development
 * subs may not match.
 */
export type LevelPascalCase =
  | 'Field'
  | 'BannedField'
  | 'BananaField'
  | 'WhatIsField'

export type FieldFixtureData = {
  /** Path to Devvit config file from root of repo. Eg, 'devvit.dev.yaml'. */
  devvitConfig: string
  levels: LevelConfig[]
  leaderboard: {
    title: string
    subredditName: string
    subredditId: T5
    url: string
  }
}

export type LevelConfig = {
  id: Level
  url: string
  postId: T3
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
  2: 'BananaField',
  3: 'WhatIsField',
}

/** Unique first word for each level. */
export const levelWord = {
  0: 'Field',
  1: 'Banned',
  2: 'Banana',
  3: 'What',
} as const

/** Shadow color per level. */
export type LevelShadowColor =
  | typeof paletteFieldDark
  | typeof paletteBannedFieldDark
  | typeof paletteBananaFieldDark
  | typeof paletteWhatIsFieldDark

export const levelShadowColor: {
  readonly [level in Level]: LevelShadowColor
} = {
  0: paletteFieldDark,
  1: paletteBannedFieldDark,
  2: paletteBananaFieldDark,
  3: paletteWhatIsFieldDark,
}

/** Base color per level. */
export type LevelBaseColor =
  | typeof paletteField
  | typeof paletteBannedField
  | typeof paletteBananaField
  | typeof paletteWhatIsField

export const levelBaseColor: {
  readonly [level in Level]: LevelBaseColor
} = {
  0: paletteField,
  1: paletteBannedField,
  2: paletteBananaField,
  3: paletteWhatIsField,
}

/** Highlight color per level. */
export type LevelHighlightColor =
  | typeof paletteFieldLight
  | typeof paletteBannedFieldLight
  | typeof paletteBananaFieldLight
  | typeof paletteWhatIsFieldLight

export const levelHighlightColor: {
  readonly [level in Level]: LevelHighlightColor
} = {
  0: paletteFieldLight,
  1: paletteBannedFieldLight,
  2: paletteBananaFieldLight,
  3: paletteWhatIsFieldLight,
}

// to-do: file a bug. I think the sandboxed runtime is injecting a variable
//        named config and the bundler can't know about it.
export const config2: Readonly<FieldFixtureData> =
  configRaw as unknown as FieldFixtureData
