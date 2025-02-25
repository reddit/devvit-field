import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {defaultChallengeConfigSet} from '../server/core/defaultChallengeConfig'

export const setDefaultConfigFormKey: FormKey = Devvit.createForm(
  {
    title: 'Set Default Config',
    description:
      'Set the default config - takes effect on start of next challenge.',
    fields: [
      {
        type: 'number',
        name: 'size',
        label: 'Size',
        defaultValue: 10,
        helpText:
          'The size of one size of the field. All fields must be a perfect square. For example, put in 10 if you want a 10x10 field (100 cells).',
      },
      {
        type: 'number',
        name: 'partitionSize',
        label: 'Partition Size',
        defaultValue: 5,
        helpText:
          'Must be perfectly divisible by the size given. For example, if you have a 10x10 field, you can put in 2 to have a 5x5 partition.',
      },
      {
        type: 'number',
        name: 'mineDensity',
        label: 'Mine Density',
        defaultValue: 2,
        helpText: 'Number between 0 and 100. 0:No mines. 100:Only mines.',
      },
    ],
  },
  async ({values}, ctx) => {
    const defaultConfig = {
      size: values.size,
      partitionSize: values.partitionSize,
      mineDensity: values.mineDensity,
    }
    console.log('defaultConfig', defaultConfig)
    await defaultChallengeConfigSet({redis: ctx.redis, config: defaultConfig})
  },
)

export const setDefaultConfigMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[BanField] Set Default Config',
  location: 'subreddit',
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(setDefaultConfigFormKey)
  },
})
