import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {type Level, config2} from '../../shared/types/level'
import {userSetLevel} from '../server/core/user'

export const setUserLevelFormKey: FormKey = Devvit.createForm(
  {
    title: 'Set User Level',
    description: 'Set a user to a given level. Useful for testing.',
    fields: [
      {
        type: 'string',
        label: 'Username',
        name: 'username',
        required: true,
      },
      {
        type: 'select',
        label: 'Level',
        name: 'level',
        required: true,
        options: ([0, 1, 2, 3, 4] satisfies Level[]).map(x => ({
          label: x.toString(),
          value: x.toString(),
        })),
      },
    ],
  },
  async ({values}, ctx) => {
    const user = await ctx.reddit.getUserByUsername(values.username)

    if (!user) {
      ctx.ui.showToast(`User ${values.username} not found`)
      return
    }

    const newLevel = await userSetLevel({
      level: parseInt(values.level[0]!, 10) as Level,
      redis: ctx.redis,
      userId: user.id,
    })

    const newLevelConfig = config2.levels.find(x => x.id === newLevel)
    if (!newLevelConfig) {
      ctx.ui.showToast(`Level ${newLevel} not found`)
      return
    }

    ctx.ui.navigateTo(newLevelConfig.url)
  },
)

export const setUserLevelMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Set User Level',
  location: ['post', 'subreddit'],
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(setUserLevelFormKey)
  },
})
