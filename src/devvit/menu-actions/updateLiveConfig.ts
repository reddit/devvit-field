import {
  Devvit,
  type FormField,
  type FormKey,
  type MenuItem,
} from '@devvit/public-api'
import {
  type AppConfig,
  getDefaultAppConfig,
} from '../../shared/types/app-config.js'
import {
  liveSettingsGet,
  liveSettingsUpdate,
} from '../server/core/live-settings.js'

type FormInitConfig = {
  currentClickCooldownMillis: number
  currentServerPollingTimeMillis: number
  currentReloadSequence: number
  currentFetcherMaxDroppedPatches: number
  currentFetcherMaxParallelS3Fetches: number
  currentFetcherMaxSeqAgeMillis: number
}

export const updateLiveConfigFormKey: FormKey = Devvit.createForm(
  (data: Partial<FormInitConfig>) => {
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
          name: 'globalFetcherMaxDroppedPatches',
          label: 'Max dropped patches',
          defaultValue:
            data.currentFetcherMaxDroppedPatches ??
            defaults.globalFetcherMaxDroppedPatches,
          helpText: `Maximum missed realtime patch messages tolerated before downloading a replace ([0, ∞), default ${defaults.globalFetcherMaxDroppedPatches}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherMaxParallelS3Fetches',
          label: 'Max parallel S3 fetches',
          defaultValue:
            data.currentFetcherMaxParallelS3Fetches ??
            defaults.globalFetcherMaxParallelS3Fetches,
          helpText: `Maximum concurrent S3 field partition downloads ([0, ∞), default ${defaults.globalFetcherMaxParallelS3Fetches}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherMaxSeqAgeMillis',
          label: 'Max sequence age (ms)',
          defaultValue:
            data.currentFetcherMaxSeqAgeMillis ??
            defaults.globalFetcherMaxSeqAgeMillis,
          helpText: `Maximum duration a partition waits for a realtime sequence update before considering artificial sequence number injection ([0, ∞), default ${defaults.globalFetcherMaxSeqAgeMillis}).`,
          required: true,
        },
      ] as const satisfies (FormField & {name: keyof AppConfig})[],
    }
  },
  async ({values}, ctx) => {
    try {
      const newLiveConfig: AppConfig = {
        globalClickCooldownMillis: values.globalClickCooldownMillis,
        globalServerPollingTimeMillis: values.globalServerPollingTimeMillis,
        globalReloadSequence: values.globalReloadSequence,
        globalFetcherMaxDroppedPatches: values.globalMaxDroppedPatches,
        globalFetcherMaxParallelS3Fetches: values.globalMaxParallelS3Fetches,
        globalFetcherMaxSeqAgeMillis: values.globalMaxSeqAgeMillis,
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

function validateLiveConfig(newConfig: AppConfig): void {
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
    !Number.isInteger(newConfig.globalFetcherMaxDroppedPatches) ||
    newConfig.globalFetcherMaxDroppedPatches < 0 ||
    !Number.isInteger(newConfig.globalFetcherMaxParallelS3Fetches) ||
    newConfig.globalFetcherMaxParallelS3Fetches < 0 ||
    !Number.isInteger(newConfig.globalFetcherMaxSeqAgeMillis) ||
    newConfig.globalFetcherMaxSeqAgeMillis < 0
  ) {
    throw Error(
      'max dropped patches, max parallel S3 fetches, and max sequence age must be ints in [0, ∞)',
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
      currentFetcherMaxDroppedPatches:
        currentLiveConfig.globalFetcherMaxDroppedPatches,
      currentFetcherMaxParallelS3Fetches:
        currentLiveConfig.globalFetcherMaxParallelS3Fetches,
      currentFetcherMaxSeqAgeMillis:
        currentLiveConfig.globalFetcherMaxSeqAgeMillis,
    } satisfies FormInitConfig)
  },
})
