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
          name: 'globalFetcherMaxDroppedPatches',
          label: 'Fetcher: max dropped patches',
          defaultValue:
            current.globalFetcherMaxDroppedPatches ??
            defaults.globalFetcherMaxDroppedPatches,
          helpText: `Maximum missed realtime patch messages tolerated before downloading a replace (ints in [0, ∞), default ${defaults.globalFetcherMaxDroppedPatches}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherMaxParallelS3Fetches',
          label: 'Fetcher: max parallel S3 fetches',
          defaultValue:
            current.globalFetcherMaxParallelS3Fetches ??
            defaults.globalFetcherMaxParallelS3Fetches,
          helpText: `Maximum concurrent S3 field partition downloads (ints in [0, ∞), default ${defaults.globalFetcherMaxParallelS3Fetches}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherMaxSeqAgeMillis',
          label: 'Fetcher: max sequence age (ms)',
          defaultValue:
            current.globalFetcherMaxSeqAgeMillis ??
            defaults.globalFetcherMaxSeqAgeMillis,
          helpText: `Maximum duration a partition waits for a realtime sequence update before considering artificial sequence number injection (ints in [0, ∞), default ${defaults.globalFetcherMaxSeqAgeMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherMaxRealtimeSilenceMillis',
          label: 'Fetcher: max realtime silence (ms)',
          defaultValue:
            current.globalFetcherMaxRealtimeSilenceMillis ??
            defaults.globalFetcherMaxRealtimeSilenceMillis,
          helpText: `Maximum duration without a realtime update before the partition poller starts guessing sequence numbers(ints in [0, ∞), default ${defaults.globalFetcherMaxRealtimeSilenceMillis}). Duration resets on next update but not on guesses.`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherGuessOffsetMillis',
          label: 'Fetcher: guess offset (ms)',
          defaultValue:
            current.globalFetcherGuessOffsetMillis ??
            defaults.globalFetcherGuessOffsetMillis,
          helpText: `When guessing at sequence numbers, how far (backward is negative, forward is positive) to adjust the guess to increase the likelihood that the sequence exists (ints in [-∞, ∞), default ${defaults.globalFetcherGuessOffsetMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherFetchRestMillis',
          label: 'Fetcher: rest period (ms)',
          defaultValue:
            current.globalFetcherFetchRestMillis ??
            defaults.globalFetcherFetchRestMillis,
          helpText: `The minimum duration between requests (ints in [0, ∞), default ${defaults.globalFetcherFetchRestMillis}).`,
          required: true,
        },
        {
          type: 'number',
          name: 'globalFetcherMandatoryReplaceSequencePeriod',
          label: 'Fetcher: mandatory replace sequence period',
          defaultValue:
            current.globalFetcherMandatoryReplaceSequencePeriod ??
            defaults.globalFetcherMandatoryReplaceSequencePeriod,
          helpText: `The max sequences to go without fetching a replace instead of just deltas (ints in [0, ∞), default ${defaults.globalFetcherMandatoryReplaceSequencePeriod}).`,
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
    !Number.isInteger(newConfig.globalFetcherMaxDroppedPatches) ||
    newConfig.globalFetcherMaxDroppedPatches < 0 ||
    !Number.isInteger(newConfig.globalFetcherMaxParallelS3Fetches) ||
    newConfig.globalFetcherMaxParallelS3Fetches < 0 ||
    !Number.isInteger(newConfig.globalFetcherMaxSeqAgeMillis) ||
    newConfig.globalFetcherMaxSeqAgeMillis < 0 ||
    !Number.isInteger(newConfig.globalFetcherMaxRealtimeSilenceMillis) ||
    newConfig.globalFetcherMaxRealtimeSilenceMillis < 0 ||
    !Number.isInteger(newConfig.globalFetcherFetchRestMillis) ||
    newConfig.globalFetcherFetchRestMillis < 0 ||
    !Number.isInteger(newConfig.globalFetcherMandatoryReplaceSequencePeriod) ||
    newConfig.globalFetcherMandatoryReplaceSequencePeriod < 0
  )
    throw Error(
      'max dropped patches, max parallel S3 fetches, max sequence age, max realtime silence, fetch rest, and mandatory replace sequence period must be ints in [0, ∞)',
    )

  if (!Number.isInteger(newConfig.globalFetcherGuessOffsetMillis))
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
