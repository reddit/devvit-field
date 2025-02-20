// Keep these imports last
import './devvit/server/scheduler/checkField.js'
import './devvit/server/triggers/install.js'
import './devvit/server/triggers/upgrade.js'

import {
  type Hello,
  HelloDefinition,
  type Metadata,
  type PingMessage,
} from '@devvit/protos'
import {Devvit} from '@devvit/public-api'
import {makeAPIClients} from '@devvit/public-api/apis/makeAPIClients.js'
import {getContextFromMetadata} from '@devvit/public-api/devvit/internals/context.js'
import type {Config} from '@devvit/shared-types/Config.js'
import {App} from './devvit/components/app.js'
import {Preview} from './devvit/components/preview.js'
import {challengeMakeNew} from './devvit/server/core/challenge.js'
import {userMakeSuperuser} from './devvit/server/core/user.js'

Devvit.configure({redditAPI: true, redis: true, realtime: true})

Devvit.addCustomPostType({name: '', height: 'tall', render: App})

const formKey = Devvit.createForm(
  {
    title: 'New BanField Post',
    description:
      'Used for development purposes only! In production, there will only be one banfield post per subreddit.',
    fields: [
      {
        type: 'number',
        name: 'size',
        label: 'Size',
        defaultValue: 10,
        helpText:
          'The size of one size of the field. All fields must be a perfect square. For example, put in 10 if you want a 10x10 field (100 cells).',
      },
      {
        type: 'number',
        name: 'partitionSize',
        label: 'Partition Size',
        defaultValue: 5,
        helpText:
          'Must be perfectly divisible by the size given. For example, if you have a 10x10 field, you can put in 2 to have a 5x5 partition.',
      },
      {
        type: 'number',
        name: 'mineDensity',
        label: 'Mine Density',
        defaultValue: 2,
        helpText: 'Number between 0 and 100. 0:No mines. 100:Only mines.',
      },
    ],
  },
  async ({values: config}, ctx) => {
    try {
      const {challengeNumber} = await challengeMakeNew({ctx, config})

      if (!ctx.subredditName) throw Error('no sub name')
      const post = await ctx.reddit.submitPost({
        preview: <Preview />,
        subredditName: ctx.subredditName,
        title: `BanField #${challengeNumber}`,
      })

      ctx.ui.navigateTo(post.url)
    } catch (error) {
      if (error instanceof Error) {
        ctx.ui.showToast(error.message)
      } else {
        ctx.ui.showToast('An error occurred, please try again.')
      }
    }
  },
)

Devvit.addMenuItem({
  forUserType: ['moderator'],
  label: '[BanField] New Post',
  location: 'subreddit',
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(formKey)
  },
})

const superuserFormKey = Devvit.createForm(
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

Devvit.addMenuItem({
  forUserType: ['moderator'],
  label: '[BanField] Make Superuser',
  location: 'subreddit',
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(superuserFormKey)
  },
})

export default class extends Devvit implements Hello {
  constructor(config: Config) {
    super(config)
    config.provides(HelloDefinition)
  }

  async Ping(_msg: PingMessage, meta?: Metadata): Promise<PingMessage> {
    const ctx = Object.assign(
      makeAPIClients({metadata: meta ?? {}}),
      getContextFromMetadata(meta ?? {}),
    )
    const bouncepotato = await ctx.reddit.getUserByUsername('bouncepotato')
    return {
      delayMillis: 0,
      message: `${bouncepotato?.username}=${bouncepotato?.id}`,
      successProbability: 0,
    }
  }
}
