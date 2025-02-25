import type {MenuItem} from '@devvit/public-api'
import {defaultChallengeConfigGet} from '../server/core/defaultChallengeConfig'

export const getDefaultConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[BanField] Get Default Config',
  location: 'subreddit',
  onPress: async (_ev, ctx) => {
    try {
      const defaultConfig = await defaultChallengeConfigGet({redis: ctx.redis})
      ctx.ui.showToast(`Default Config: ${JSON.stringify(defaultConfig)}`)
      console.log(`Default Config: ${JSON.stringify(defaultConfig)}`)
    } catch (error) {
      ctx.ui.showToast(`${error}`)
      console.error(error)
    }
  },
})
