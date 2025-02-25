import type {MenuItem} from '@devvit/public-api'
import {defaultChallengeConfigGet} from '../server/core/defaultChallengeConfig'

export const getDefaultConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[BanField] Get Default Config',
  location: 'subreddit',
  onPress: async (_ev, ctx) => {
    const defaultConfig = await defaultChallengeConfigGet({redis: ctx.redis})
    console.log(`Default Config: ${JSON.stringify(defaultConfig)}`)
  },
})
