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

export const updateLiveConfigFormKey: FormKey = Devvit.createForm(
  (current: Partial<AppConfig>) => {
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
            current.globalClickCooldownMillis ??
            defaults.globalClickCooldownMillis,
          helpText: `How long to force the user to wait before claiming another cell (default ${defaults.globalClickCooldownMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalServerPollingTimeMillis',
          label: 'Server polling time (ms)',
          defaultValue:
            current.globalServerPollingTimeMillis ??
            defaults.globalServerPollingTimeMillis,
          helpText: `How long clients should wait before polling the server for updates (default ${defaults.globalServerPollingTimeMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalReloadSequence',
          label: 'Reload sequence',
          defaultValue:
            current.globalReloadSequence ?? defaults.globalReloadSequence,
          helpText: `Change this to a different, >0 value to force clients to reload (default ${defaults.globalReloadSequence}). USE WITH CARE.`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalPDFDebug',
          label: 'Partition data fetcher: debug mode',
          defaultValue: current.globalPDFDebug ?? defaults.globalPDFDebug,
          helpText: `Debug mode (ints in [0, ∞), default ${defaults.globalPDFDebug}). 0 is off, great is verbose.`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalPDFGuessAfterMillis',
          label: 'Partition data fetcher: realtime silence tolerance (ms)',
          defaultValue:
            current.globalPDFGuessAfterMillis ??
            defaults.globalPDFGuessAfterMillis,
          helpText: `Maximum duration without a realtime update before guessing sequences (ints in [0, ∞), default ${defaults.globalPDFGuessAfterMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalPDFGuessOffsetMillis',
          label: 'Partition data fetcher: guess offset (ms)',
          defaultValue:
            current.globalPDFGuessOffsetMillis ??
            defaults.globalPDFGuessOffsetMillis,
          helpText: `When guessing sequences, how far (backward is negative, forward is positive) to adjust the guess to increase the likelihood that the sequence exists (ints in [-∞, ∞), default ${defaults.globalPDFGuessOffsetMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalPDFMaxDroppedPatches',
          label: 'Partition data fetcher: max dropped patches',
          defaultValue:
            current.globalPDFMaxDroppedPatches ??
            defaults.globalPDFMaxDroppedPatches,
          helpText: `Maximum missed realtime patch messages before preferring a partition replace (ints in [0, ∞), default ${defaults.globalPDFMaxDroppedPatches}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalPDFMaxParallelFetches',
          label: 'Partition data fetcher: max parallel fetches',
          defaultValue:
            current.globalPDFMaxParallelFetches ??
            defaults.globalPDFMaxParallelFetches,
          helpText: `Maximum concurrent fetch threads across all partitions (ints in [1, 16], default ${defaults.globalPDFMaxParallelFetches}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalPDFMaxPatchesWithoutReplace',
          label: 'Partition data fetcher: mandatory replace sequence period',
          defaultValue:
            current.globalPDFMaxPatchesWithoutReplace ??
            defaults.globalPDFMaxPatchesWithoutReplace,
          helpText: `The max sequences to go without fetching a replace instead of just patches (ints in [0, ∞), default ${defaults.globalPDFMaxPatchesWithoutReplace}).`,
          required: true,
        },
      ] as const satisfies (FormField & {name: keyof AppConfig})[],
    }
  },
  async ({values: newLiveConfig}, ctx) => {
    try {
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
    !Number.isInteger(newConfig.globalPDFMaxDroppedPatches) ||
    newConfig.globalPDFMaxDroppedPatches < 0 ||
    !Number.isInteger(newConfig.globalPDFGuessAfterMillis) ||
    newConfig.globalPDFGuessAfterMillis < 0 ||
    !Number.isInteger(newConfig.globalPDFMaxPatchesWithoutReplace) ||
    newConfig.globalPDFMaxPatchesWithoutReplace < 0
  )
    throw Error(
      'max dropped patches, guess after, and max patches without replace must be ints in [0, ∞)',
    )

  if (
    !Number.isInteger(newConfig.globalPDFMaxParallelFetches) ||
    newConfig.globalPDFMaxParallelFetches < 1 ||
    newConfig.globalPDFMaxParallelFetches > 16
  )
    throw Error('max parallel fetches must be an int in [1, 16]')

  if (!Number.isInteger(newConfig.globalPDFGuessOffsetMillis))
    throw Error('guess offset must be an int in (-∞, ∞)')
}

export const updateLiveConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Update Live Config',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    // This is a partial config when adding new entries.
    const currentLiveConfig: Partial<AppConfig> = await liveSettingsGet({
      redis: ctx.redis,
    })
    ctx.ui.showForm(updateLiveConfigFormKey, currentLiveConfig)
  },
})
