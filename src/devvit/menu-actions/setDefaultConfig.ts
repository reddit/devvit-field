import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import type {DefaultChallengeConfig} from '../../shared/types/challenge-config'
import {validateChallengeConfig} from '../../shared/validateChallengeConfig'
import {validateFieldArea} from '../../shared/validateFieldArea'
import {makeFallbackDefaultChallengeConfig} from '../server/core/challenge'
import {
  defaultChallengeConfigMaybeGet,
  defaultChallengeConfigSet,
} from '../server/core/defaultChallengeConfig'

export const setDefaultConfigFormKey: FormKey = Devvit.createForm(
  args => {
    const data = args as DefaultChallengeConfig | undefined

    const defaults = makeFallbackDefaultChallengeConfig()
    return {
      title: 'Set Default Config',
      description:
        'Set the default config - takes effect on start of next challenge.',
      fields: [
        {
          type: 'number',
          name: 'size',
          label: 'Size',
          defaultValue: data?.size ?? defaults.size,
          helpText:
            'The size of one side of the field. All fields must be a perfect square. For example, put in 10 if you want a 10x10 field (100 cells).',
          required: true,
        },
        {
          type: 'number',
          name: 'partitionSize',
          label: 'Partition Size',
          defaultValue: data?.partitionSize ?? defaults.partitionSize,
          helpText:
            'Must be perfectly divisible by the size given. For example, if you have a 10x10 field, you can put in 2 to have a 5x5 partition.',
          required: true,
        },
        {
          type: 'number',
          name: 'mineDensity',
          label: 'Mine Density',
          defaultValue: data?.mineDensity ?? defaults.mineDensity,
          helpText: 'Number between 0 and 100. 0:No mines. 100:Only mines.',
          required: true,
        },
        {
          type: 'number',
          name: 'targetGameDurationSeconds',
          label: 'Target Game Duration (seconds)',
          defaultValue: 0,
          helpText:
            'Zero to disable autoscaling. Positive value gives target game duration (in seconds) for autoscaler to target.',
        },
      ],
    } as const
  },
  async ({values}, ctx) => {
    try {
      const defaultConfig = {
        size: values.size,
        partitionSize: values.partitionSize,
        mineDensity: values.mineDensity,
        targetGameDurationSeconds: values.targetGameDurationSeconds,
      }

      validateChallengeConfig(defaultConfig)
      validateFieldArea(defaultConfig.size)

      await defaultChallengeConfigSet({redis: ctx.redis, config: defaultConfig})
      ctx.ui.showToast('Default config updated successfully!')
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

export const setDefaultConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Set Default Config',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    try {
      const currentDefaultConfig = await defaultChallengeConfigMaybeGet({
        redis: ctx.redis,
      })

      ctx.ui.showForm(setDefaultConfigFormKey, currentDefaultConfig)
    } catch (error) {
      console.error('Error fetching default config:', error)
    }
  },
})
