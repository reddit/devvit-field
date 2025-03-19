import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {userGet, userSet} from '../server/core/user'

export const resetUserGlobalPointCountFormKey: FormKey = Devvit.createForm(
  {
    title: 'Reset Global Point Counter',
    description: 'Reset the global point counter for a user.',
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
    try {
      const user = await ctx.reddit.getUserByUsername(values.username)

      if (!user) {
        ctx.ui.showToast(`User ${values.username} not found`)
        return
      }

      const profile = await userGet({redis: ctx.redis, userId: user.id})

      await userSet({redis: ctx.redis, user: {...profile, globalPointCount: 0}})

      ctx.ui.showToast(`User ${values.username} global point count reset`)
    } catch (error) {
      if (error instanceof Error) {
        ctx.ui.showToast(error.message)
      } else {
        ctx.ui.showToast('An unknown error occurred')
      }
    }
  },
)

export const resetUserGlobalPointCountMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Reset User Global Point Counter',
  location: ['post', 'subreddit'],
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(resetUserGlobalPointCountFormKey)
  },
})
