import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {
  type AppConfig,
  getDefaultAppConfig,
} from '../../shared/types/app-config.js'
import {
  liveSettingsGet,
  liveSettingsUpdate,
} from '../server/core/live-settings.js'

export const updateLiveConfigFormKey: FormKey = Devvit.createForm(
  (data: {
    currentClickCooldownMillis?: number
    currentServerPollingTimeMillis?: number
    currentReloadSequence?: number
    currentMaxDroppedPatches?: number
    currentMaxParallelS3Fetches?: number
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
          helpText: `How long to force the user to wait before claiming another cell (default ${defaults.globalClickCooldownMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalServerPollingTimeMillis',
          label: 'Server polling time (ms)',
          defaultValue:
            data.currentServerPollingTimeMillis ??
            defaults.globalServerPollingTimeMillis,
          helpText: `How long clients should wait before polling the server for updates (default ${defaults.globalServerPollingTimeMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalReloadSequence',
          label: 'Reload sequence',
          defaultValue:
            data.currentReloadSequence ?? defaults.globalReloadSequence,
          helpText: `Change this to a different, >0 value to force clients to reload (default ${defaults.globalReloadSequence}). USE WITH CARE.`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalMaxDroppedPatches',
          label: 'Max dropped patches',
          defaultValue:
            data.currentMaxDroppedPatches ?? defaults.globalMaxDroppedPatches,
          helpText: `Maximum missed realtime patch messages tolerated before downloading a replace ([0, ∞), default ${defaults.globalMaxDroppedPatches}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalMaxParallelS3Fetches',
          label: 'Max parallel S3 fetches',
          defaultValue:
            data.currentMaxParallelS3Fetches ??
            defaults.globalMaxParallelS3Fetches,
          helpText: `Maximum concurrent S3 field partition downloads ([0, ∞), default ${defaults.globalMaxParallelS3Fetches}).`,
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
        globalReloadSequence: values.globalReloadSequence,
        globalMaxDroppedPatches: values.globalMaxDroppedPatches,
        globalMaxParallelS3Fetches: values.globalMaxParallelS3Fetches,
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
    !Number.isInteger(newConfig.globalServerPollingTimeMillis) ||
    !Number.isInteger(newConfig.globalReloadSequence)
  ) {
    throw new Error(
      'Click cooldown, server polling time, reload sequence must be integers',
    )
  }

  if (newConfig.globalClickCooldownMillis < 0) {
    throw new Error('Click cooldown must be greater than or equal to 0')
  }

  if (newConfig.globalReloadSequence < 0) {
    throw new Error('Reload sequence must be greater than or equal to 0')
  }

  if (newConfig.globalServerPollingTimeMillis < 250) {
    throw new Error(
      'Server polling time must be greater than or equal to 250ms',
    )
  }

  if (
    !Number.isInteger(newConfig.globalMaxDroppedPatches) ||
    newConfig.globalMaxDroppedPatches < 0 ||
    !Number.isInteger(newConfig.globalMaxParallelS3Fetches) ||
    newConfig.globalMaxParallelS3Fetches < 0
  ) {
    throw Error(
      'max dropped patches and max parallel S3 fetchs must be ints in [0, ∞)',
    )
  }
}

export const updateLiveConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Update Live Config',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    const currentLiveConfig = await liveSettingsGet({
      redis: ctx.redis,
    })
    ctx.ui.showForm(updateLiveConfigFormKey, {
      currentClickCooldownMillis: currentLiveConfig.globalClickCooldownMillis,
      currentServerPollingTimeMillis:
        currentLiveConfig.globalServerPollingTimeMillis,
      currentReloadSequence: currentLiveConfig.globalReloadSequence,
      currentMaxDroppedPatches: currentLiveConfig.globalMaxDroppedPatches,
      currentMaxParallelS3Fetches: currentLiveConfig.globalMaxParallelS3Fetches,
    })
  },
})
