// to-do: Uncomment me for prod!!
// import configRaw from '../config/config.prod.json'
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
  paletteVeryBannedField,
  paletteVeryBannedFieldDark,
  paletteVeryBannedFieldLight,
  paletteWhatIsField,
  paletteWhatIsFieldDark,
  paletteWhatIsFieldLight,
} from '../theme'
// to-do: Make sure we don't spoil the levels in the client bundle by getting the colors here.
import type {T3, T5} from './tid'

/** The current level the user is on */
export type Level = 0 | 1 | 2 | 3 | 4

/**
 * Field level / subreddit enumeration. Doesn't include r/ prefix. Development
 * subs may not match.
 */
export type LevelPascalCase =
  | 'Field'
  | 'BannedField'
  | 'VeryBannedField'
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
    postId: T3
    url: string
  }
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

/** Shadow color per level. */
export type LevelShadowColor =
  | typeof paletteFieldDark
  | typeof paletteBannedFieldDark
  | typeof paletteVeryBannedFieldDark
  | typeof paletteBananaFieldDark
  | typeof paletteWhatIsFieldDark

export const levelShadowColor: {
  readonly [level in Level]: LevelShadowColor
} = {
  0: paletteFieldDark,
  1: paletteBannedFieldDark,
  2: paletteVeryBannedFieldDark,
  3: paletteBananaFieldDark,
  4: paletteWhatIsFieldDark,
}

/** Base color per level. */
export type LevelBaseColor =
  | typeof paletteField
  | typeof paletteBannedField
  | typeof paletteVeryBannedField
  | typeof paletteBananaField
  | typeof paletteWhatIsField

export const levelBaseColor: {
  readonly [level in Level]: LevelBaseColor
} = {
  0: paletteField,
  1: paletteBannedField,
  2: paletteVeryBannedField,
  3: paletteBananaField,
  4: paletteWhatIsField,
}

/** Highlight color per level. */
export type LevelHighlightColor =
  | typeof paletteFieldLight
  | typeof paletteBannedFieldLight
  | typeof paletteVeryBannedFieldLight
  | typeof paletteBananaFieldLight
  | typeof paletteWhatIsFieldLight

export const levelHighlightColor: {
  readonly [level in Level]: LevelHighlightColor
} = {
  0: paletteFieldLight,
  1: paletteBannedFieldLight,
  2: paletteVeryBannedFieldLight,
  3: paletteBananaFieldLight,
  4: paletteWhatIsFieldLight,
}

export const config: Readonly<FieldFixtureData> = configRaw as FieldFixtureData
