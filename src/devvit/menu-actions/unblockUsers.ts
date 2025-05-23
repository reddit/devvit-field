import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {userUnblock} from '../server/core/user'

export const unblockUserKey: FormKey = Devvit.createForm(
  {
    title: 'Unblock User',
    description: 'This ban users from all subreddits and challenges.',
    fields: [
      {
        type: 'paragraph',
        name: 'usernames',
        label: 'Usernames',
        required: true,
        helpText:
          'Enter the usernames of the users you would like to unblock. Separate multiple usernames with commas.',
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

        await userUnblock({
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

export const unblockUsersMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Unblock Users',
  location: ['post', 'subreddit'],
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(unblockUserKey)
  },
})
