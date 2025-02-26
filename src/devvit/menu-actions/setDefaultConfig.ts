import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {validateChallengeConfig} from '../../shared/validateChallengeConfig'
import {validateFieldArea} from '../../shared/validateFieldArea'
import {
  defaultChallengeConfigMaybeGet,
  defaultChallengeConfigSet,
} from '../server/core/defaultChallengeConfig'

export const setDefaultConfigFormKey: FormKey = Devvit.createForm(
  (data: {
    currentDefaultSize?: number
    currentDefaultPartitionSize?: number
    currentDefaultMineDensity?: number
  }) => {
    return {
      title: 'Set Default Config',
      description:
        'Set the default config - takes effect on start of next challenge.',
      fields: [
        {
          type: 'number',
          name: 'size',
          label: 'Size',
          defaultValue: data.currentDefaultSize || 10,
          helpText:
            'The size of one side of the field. All fields must be a perfect square. For example, put in 10 if you want a 10x10 field (100 cells).',
          required: true,
          min: 2,
        },
        {
          type: 'number',
          name: 'partitionSize',
          label: 'Partition Size',
          defaultValue: data.currentDefaultPartitionSize || 5,
          helpText:
            'Must be perfectly divisible by the size given. For example, if you have a 10x10 field, you can put in 2 to have a 5x5 partition.',
          required: true,
          min: 1,
        },
        {
          type: 'number',
          name: 'mineDensity',
          label: 'Mine Density',
          defaultValue: data.currentDefaultMineDensity || 2,
          helpText: 'Number between 0 and 100. 0:No mines. 100:Only mines.',
          required: true,
          min: 1,
          max: 100,
        },
      ],
    }
  },
  async ({values}, ctx) => {
    const defaultConfig = {
      size: values.size,
      partitionSize: values.partitionSize,
      mineDensity: values.mineDensity,
    }
    console.log('defaultConfig', defaultConfig)

    try {
      validateChallengeConfig(defaultConfig)
      validateFieldArea(defaultConfig.size)
    } catch (error) {
      ctx.ui.showToast(`${error}`)
      console.error(error)
      return
    }

    await defaultChallengeConfigSet({redis: ctx.redis, config: defaultConfig})
    ctx.ui.showToast('Default config updated successfully!')
  },
)

export const setDefaultConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[BanField] Set Default Config',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    try {
      const currentDefaultConfig = await defaultChallengeConfigMaybeGet({
        redis: ctx.redis,
      })
      if (currentDefaultConfig) {
        ctx.ui.showForm(setDefaultConfigFormKey, {
          currentDefaultSize: currentDefaultConfig.size,
          currentDefaultPartitionSize: currentDefaultConfig.partitionSize,
          currentDefaultMineDensity: currentDefaultConfig.mineDensity,
        })
      }
      return
    } catch (error) {
      console.error('Error fetching default config:', error)
    }
    ctx.ui.showForm(setDefaultConfigFormKey)
  },
})
