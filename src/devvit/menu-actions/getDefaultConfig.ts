import type {MenuItem} from '@devvit/public-api'
import {defaultChallengeConfigMaybeGet} from '../server/core/defaultChallengeConfig'

export const getDefaultConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Get Default Config',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    const defaultConfig = await defaultChallengeConfigMaybeGet({
      redis: ctx.redis,
    })

    if (!defaultConfig) {
      ctx.ui.showToast('No default config found')
      return
    }
    ctx.ui.showToast(`Default Config: ${JSON.stringify(defaultConfig)}`)
    console.log(`Default Config: ${JSON.stringify(defaultConfig)}`)
  },
})
