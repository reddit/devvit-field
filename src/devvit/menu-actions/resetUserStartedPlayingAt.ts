import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {userDeleteStartedPlayingAt} from '../server/core/user'

export const resetUserStartedPlayingAtFormKey: FormKey = Devvit.createForm(
  {
    title: 'Reset Started Playing At',
    description: 'Reset the started playing for a user.',
    fields: [
      {
        type: 'string',
        label: 'Username',
        name: 'username',
        required: true,
      },
    ],
  },
  async ({values}, ctx) => {
    const user = await ctx.reddit.getUserByUsername(values.username)

    if (!user) {
      ctx.ui.showToast(`User ${values.username} not found`)
      return
    }

    await userDeleteStartedPlayingAt({
      redis: ctx.redis,
      userId: user.id,
    })

    ctx.ui.showToast(`User ${values.username} started playing at reset`)
  },
)

export const resetUserStartedPlayingAtMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Reset User Started Playing At',
  location: ['post', 'subreddit'],
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(resetUserStartedPlayingAtFormKey)
  },
})
