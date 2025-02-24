import type {LevelConfig} from '../../../shared/types/level'

// PRODUCTION
// export const levels: LevelConfig[] = [
//   {
//     id: 0,
//     subredditId: 't5_dkz0bh',
//     // @ts-expect-error need to install on the sub and make a post first
//     postId: '',
//     subredditName: 'PlayBanField',
//     theme: {},
//   },
//   {
//     id: 1,
//     subredditId: 't5_dkz0gv',
//     // @ts-expect-error need to install on the sub and make a post first
//     postId: '',
//     subredditName: 'CantPlayBanField',
//     theme: {},
//   },
//   {
//     id: 2,
//     subredditId: 't5_dkz0k9',
//     // @ts-expect-error need to install on the sub and make a post first
//     postId: '',
//     subredditName: 'BananaField',
//     theme: {},
//   },
//   {
//     id: 3,
//     subredditId: 't5_dkz0qm',
//     // @ts-expect-error need to install on the sub and make a post first
//     postId: '',
//     subredditName: 'WhyBanField',
//     theme: {},
//   },
//   {
//     id: 4,
//     subredditId: 't5_dkz0tb',
//     // @ts-expect-error need to install on the sub and make a post first
//     postId: '',
//     subredditName: 'WhatIsBanField',
//     theme: {},
//   },
// ]

export const levels: LevelConfig[] = [
  {
    id: 0,
    subredditId: 't5_dii275',
    postId: 't3_1iwsnfy',
    subredditName: 'xBanland0',
    theme: {},
  },
  // {
  //   id: 1,
  //   subredditId: 't5_dkz0gv',
  //   // @ts-expect-error need to install on the sub and make a post first
  //   postId: '',
  //   subredditName: 'CantPlayBanField',
  //   theme: {},
  // },
  // {
  //   id: 2,
  //   subredditId: 't5_dkz0k9',
  //   // @ts-expect-error need to install on the sub and make a post first
  //   postId: '',
  //   subredditName: 'BananaField',
  //   theme: {},
  // },
  // {
  //   id: 3,
  //   subredditId: 't5_dkz0qm',
  //   // @ts-expect-error need to install on the sub and make a post first
  //   postId: '',
  //   subredditName: 'WhyBanField',
  //   theme: {},
  // },
  // {
  //   id: 4,
  //   subredditId: 't5_dkz0tb',
  //   // @ts-expect-error need to install on the sub and make a post first
  //   postId: '',
  //   subredditName: 'WhatIsBanField',
  //   theme: {},
  // },
]

export const makeLevelRedirect = (levelNumber: number) => {
  const level = levels.find(x => x.id === levelNumber)

  if (!level) {
    throw new Error(`Level ${levelNumber} not found`)
  }

  // TODO: I notice this redirects on the client, could save some time by using the EXACT url
  return `https://www.reddit.com/r/${level.subredditName}/comments/${level.postId}`
}
