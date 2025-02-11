import './devvit/triggers/checkMinefield.js'

// Keep these imports last
import './devvit/triggers/install.js'
import './devvit/triggers/upgrade.js'

import type {Hello, Metadata, PingMessage} from '@devvit/protos'
import {Devvit} from '@devvit/public-api'
import {App} from './devvit/components/app.js'
import {challengeMakeNew} from './devvit/server/core/challenge.js'

Devvit.configure({redditAPI: true, redis: true})

Devvit.addCustomPostType({name: '', height: 'regular', render: App})

Devvit.addMenuItem({
  forUserType: ['moderator'],
  label: 'New Banfield Post',
  location: 'subreddit',
  onPress: async (_ev, ctx) => {
    const {url} = await challengeMakeNew({ctx})

    ctx.ui.navigateTo(url)
  },
})

export default class extends Devvit implements Hello {
  async Ping(msg: PingMessage, meta?: Metadata): Promise<PingMessage> {
    console.log(`msg=${JSON.stringify(msg)} meta=${JSON.stringify(meta)}`)
    return msg
  }
}
