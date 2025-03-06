import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import type {AppConfig} from '../../shared/types/app-config'
import {
  getDefaultAppConfig,
  liveSettingsGet,
  liveSettingsUpdate,
} from '../server/core/live-settings'

export const updateLiveConfigFormKey: FormKey = Devvit.createForm(
  (data: {
    currentClickCooldownMillis?: number
    currentServerPollingTimeMillis?: number
  }) => {
    const defaults = getDefaultAppConfig()
    return {
      title: 'Update App Config',
      description:
        'Sets the app config - updates are immediately sent to all users.',
      fields: [
        {
          type: 'number',
          name: 'globalClickCooldownMillis',
          label: 'Click cooldown time (ms)',
          defaultValue:
            data.currentClickCooldownMillis ??
            defaults.globalClickCooldownMillis,
          helpText:
            'How long to force the user to wait before claiming another cell.',
          required: true,
        },
        {
          type: 'number',
          name: 'globalServerPollingTimeMillis',
          label: 'Server polling time (ms)',
          defaultValue:
            data.currentServerPollingTimeMillis ??
            defaults.globalServerPollingTimeMillis,
          helpText:
            'How long clients should wait before polling the server for updates.',
          required: true,
        },
      ],
    }
  },
  async ({values}, ctx) => {
    try {
      const newLiveConfig: AppConfig = {
        globalClickCooldownMillis: values.globalClickCooldownMillis,
        globalServerPollingTimeMillis: values.globalServerPollingTimeMillis,
      }

      validateLiveConfig(newLiveConfig)

      await liveSettingsUpdate(ctx, newLiveConfig)
      ctx.ui.showToast('Updated live config!')
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message)
        ctx.ui.showToast(`${error.message}`)
      } else {
        console.error('Unknown error:', error)
        ctx.ui.showToast('Unable to validate config values. Please try again.')
      }
    }
  },
)

function validateLiveConfig(newConfig: AppConfig) {
  if (
    !Number.isInteger(newConfig.globalClickCooldownMillis) ||
    !Number.isInteger(newConfig.globalServerPollingTimeMillis)
  ) {
    throw new Error('Click cooldown and server polling time must be integers')
  }

  if (newConfig.globalClickCooldownMillis < 0) {
    throw new Error('Click cooldown must be greater than or equal to 0')
  }

  if (newConfig.globalServerPollingTimeMillis < 250) {
    throw new Error(
      'Server polling time must be greater than or equal to 250ms',
    )
  }
}

export const updateLiveConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[BanField] Update Live Config',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    const currentLiveConfig = await liveSettingsGet({
      redis: ctx.redis,
    })
    ctx.ui.showForm(updateLiveConfigFormKey, {
      currentClickCooldownMillis: currentLiveConfig.globalClickCooldownMillis,
      currentServerPollingTimeMillis:
        currentLiveConfig.globalServerPollingTimeMillis,
    })
  },
})
