import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {userMakeSuperuser} from '../server/core/user'

export const superuserFormKey: FormKey = Devvit.createForm(
  {
    title: 'Make Superuser',
    description: 'Gives the users added here super powers.',
    fields: [
      {
        type: 'paragraph',
        name: 'usernames',
        label: 'Usernames',
        lineHeight: 4,
        helpText: 'Separate multiple usernames with a comma.',
        required: true,
      },
    ],
  },
  async ({values}, ctx) => {
    const succeededUsernames: string[] = []
    const failedUsernames: string[] = []
    const items = values.usernames.split(',').map(username => username.trim())

    if (items.length === 0) {
      ctx.ui.showToast('No usernames provided')
      return
    }

    for (const username of items) {
      try {
        if (!ctx.subredditName) throw Error('no sub name')
        const user = await ctx.reddit.getUserByUsername(username)
        if (!user) throw Error('user not found')

        await userMakeSuperuser({
          redis: ctx.redis,
          userId: user.id,
        })
        succeededUsernames.push(username)
      } catch (error) {
        console.error(error)
        failedUsernames.push(username)
      }
    }

    ctx.ui.showToast(`Succeeded: ${succeededUsernames.join(', ')}`)

    if (failedUsernames.length) {
      ctx.ui.showToast(`Failed: ${failedUsernames.join(', ')}`)
    }
  },
)
export const makeSuperUserMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[BanField] Make Superuser',
  location: 'subreddit',
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(superuserFormKey)
  },
})
