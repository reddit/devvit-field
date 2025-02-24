import type {LevelConfig} from '../../../shared/types/level'

// PRODUCTION
export const levels: LevelConfig[] = [
  {
    id: 0,
    subredditId: 't5_dkz0bh',
    postId: 't3_1ix3spv',
    subredditName: 'PlayBanField',
    theme: {},
  },
  {
    id: 1,
    subredditId: 't5_dkz0gv',
    postId: 't3_1ix3t89',
    subredditName: 'CantPlayBanField',
    theme: {},
  },
  {
    id: 2,
    subredditId: 't5_dkz0k9',
    postId: 't3_1ix3tky',
    subredditName: 'BananaField',
    theme: {},
  },
  {
    id: 3,
    subredditId: 't5_dkz0qm',
    postId: 't3_1ix3tuy',
    subredditName: 'WhyBanField',
    theme: {},
  },
  {
    id: 4,
    subredditId: 't5_dkz0tb',
    postId: 't3_1ix3u9l',
    subredditName: 'WhatIsBanField',
    theme: {},
  },
]

// export const levels: LevelConfig[] = [
//   {
//     id: 0,
//     subredditId: 't5_dii275',
//     postId: 't3_1iwsnfy',
//     subredditName: 'xBanland0',
//     theme: {},
//   },
//   {
//     id: 1,
//     subredditId: 't5_dii2at',
//     postId: 't3_1iwup5r',
//     subredditName: 'xBanland1',
//     theme: {},
//   },
//   {
//     id: 2,
//     subredditId: 't5_dii2xj',
//     postId: 't3_1iwuphy',
//     subredditName: 'xBanland2',
//     theme: {},
//   },
// ]

export const makeLevelRedirect = (levelNumber: number) => {
  const level = levels.find(x => x.id === levelNumber)

  if (!level) {
    throw new Error(`Level ${levelNumber} not found`)
  }

  // TODO: I notice this redirects on the client, could save some time by using the EXACT url
  return `https://www.reddit.com/r/${level.subredditName}/comments/${level.postId}`
}
