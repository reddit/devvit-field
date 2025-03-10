// Keep these imports last
import './devvit/server/scheduler/emitDeltas.js'
import './devvit/server/scheduler/leaderboardUpdate.js'
import './devvit/server/triggers/install.js'
import './devvit/server/triggers/upgrade.js'

import {
  type Hello,
  HelloDefinition,
  type Metadata,
  type PingMessage,
} from '@devvit/protos'
import {Devvit} from '@devvit/public-api'
import {makeAPIClients} from '@devvit/public-api/apis/makeAPIClients.js'
import {getContextFromMetadata} from '@devvit/public-api/devvit/internals/context.js'
import type {Config} from '@devvit/shared-types/Config.js'
import {DialogWelcomeLoading} from './devvit/components/DialogWelcomeLoading.js'
import {LeaderboardLoading} from './devvit/components/LeaderboardLoading.js'
import {App} from './devvit/components/app.js'
import {blockUsersMenuAction} from './devvit/menu-actions/blockUsers.js'
import {endCurrentChallengeMenuAction} from './devvit/menu-actions/endCurrentChallenge.js'
import {getDefaultConfigMenuAction} from './devvit/menu-actions/getDefaultConfig.js'
import {makeSuperUserMenuAction} from './devvit/menu-actions/makeSuperUser.js'
import {setDefaultConfigMenuAction} from './devvit/menu-actions/setDefaultConfig.js'
import {setUserLevelMenuAction} from './devvit/menu-actions/setUserLevel.js'
import {unblockUsersMenuAction} from './devvit/menu-actions/unblockUsers.js'
import {updateLiveConfigMenuAction} from './devvit/menu-actions/updateLiveConfig.js'
import {
  challengeConfigGet,
  challengeMakeNew,
  makeFallbackDefaultChallengeConfig,
} from './devvit/server/core/challenge.js'
import {defaultChallengeConfigMaybeGet} from './devvit/server/core/defaultChallengeConfig.js'
import {fieldClaimCells} from './devvit/server/core/field.js'
import {LEADERBOARD_CONFIG, levels} from './devvit/server/core/levels.js'
import {fallbackPixelRatio} from './shared/theme.js'
import type {Level} from './shared/types/level.js'
import {T2} from './shared/types/tid.js'
import {validateChallengeConfig} from './shared/validateChallengeConfig.js'
import {validateFieldArea} from './shared/validateFieldArea.js'

Devvit.configure({redditAPI: true, redis: true, realtime: true})

Devvit.addCustomPostType({name: '', height: 'tall', render: App})

const newPostFormKey = Devvit.createForm(
  (data: {
    currentDefaultSize?: number
    currentDefaultPartitionSize?: number
    currentDefaultMineDensity?: number
  }) => {
    const defaults = makeFallbackDefaultChallengeConfig()
    return {
      title: 'New BanField Post',
      description:
        'Used for development purposes only! In production, there will only be one field post per subreddit.',
      fields: [
        {
          type: 'number',
          name: 'size',
          label: 'Size',
          defaultValue: data.currentDefaultSize || defaults.size,
          helpText:
            'The size of one side of the field. All fields must be a perfect square. For example, put in 10 if you want a 10x10 field (100 cells).',
        },
        {
          type: 'number',
          name: 'partitionSize',
          label: 'Partition Size',
          defaultValue:
            data.currentDefaultPartitionSize || defaults.partitionSize,

          helpText:
            'Must be perfectly divisible by the size given. For example, if you have a 10x10 field, you can put in 2 to have a 5x5 partition.',
        },
        {
          type: 'number',
          name: 'mineDensity',
          label: 'Mine Density',
          defaultValue: data.currentDefaultMineDensity || defaults.mineDensity,
          helpText: 'Number between 0 and 100. 0:No mines. 100:Only mines.',
        },
      ],
    }
  },
  async ({values}, ctx) => {
    try {
      const config = {
        size: values.size,
        partitionSize: values.partitionSize,
        mineDensity: values.mineDensity,
      }

      validateChallengeConfig({
        size: config.size,
        partitionSize: config.partitionSize,
        mineDensity: config.mineDensity,
      })
      validateFieldArea(config.size)

      await challengeMakeNew({ctx, config})

      if (!ctx.subredditName) throw Error('no sub name')

      const lvl =
        ctx.subredditName === LEADERBOARD_CONFIG.subredditName
          ? LEADERBOARD_CONFIG
          : levels.find(lvl => lvl.subredditName === ctx.subredditName)
      if (!lvl)
        throw Error(
          'Cannot find level, please add the subreddit name to the config file, upload, make a post, and fill in the rest of the config to continue.',
        )

      const isLeaderboard =
        ctx.subredditName === LEADERBOARD_CONFIG.subredditName

      const post = await ctx.reddit.submitPost({
        preview: isLeaderboard ? (
          <LeaderboardLoading pixelRatio={fallbackPixelRatio} />
        ) : (
          <DialogWelcomeLoading
            pixelRatio={fallbackPixelRatio}
            level={
              levels.findIndex(
                lvl => lvl.subredditId === ctx.subredditId,
              ) as Level
            }
          />
        ),
        subredditName: ctx.subredditName,
        title: lvl.title,
      })

      ctx.ui.navigateTo(post.url)
    } catch (error) {
      if (error instanceof Error) {
        ctx.ui.showToast(error.message)
      } else {
        ctx.ui.showToast('An error occurred, please try again.')
      }
    }
  },
)

Devvit.addMenuItem({
  forUserType: ['moderator'],
  label: '[Field] New Post',
  location: ['post', 'subreddit'],
  onPress: async (_ev, ctx) => {
    try {
      const currentDefaultConfig = await defaultChallengeConfigMaybeGet({
        redis: ctx.redis,
      })

      if (currentDefaultConfig) {
        ctx.ui.showForm(newPostFormKey, {
          currentDefaultSize: currentDefaultConfig?.size,
          currentDefaultPartitionSize: currentDefaultConfig?.partitionSize,
          currentDefaultMineDensity: currentDefaultConfig?.mineDensity,
        })
        return
      }
    } catch (error) {
      console.error('Error fetching default config:', error)
    }
    ctx.ui.showForm(newPostFormKey)
  },
})

Devvit.addMenuItem(makeSuperUserMenuAction())
Devvit.addMenuItem(setUserLevelMenuAction())
Devvit.addMenuItem(setDefaultConfigMenuAction())
Devvit.addMenuItem(getDefaultConfigMenuAction())
Devvit.addMenuItem(updateLiveConfigMenuAction())
Devvit.addMenuItem(endCurrentChallengeMenuAction())
Devvit.addMenuItem(blockUsersMenuAction())
Devvit.addMenuItem(unblockUsersMenuAction())

/** Returns whole numbers in [min, max). */
function getRandomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min)
}

export default class extends Devvit implements Hello {
  constructor(config: Config) {
    super(config)
    config.provides(HelloDefinition)
  }

  async Ping(msg: PingMessage, meta?: Metadata): Promise<PingMessage> {
    // We use delay millis as a proxy for challenge number
    // If not provided, return the message
    if (!msg.delayMillis) return msg

    const ctx = Object.assign(
      makeAPIClients({metadata: meta ?? {}}),
      getContextFromMetadata(meta ?? {}),
    )

    const challenge = await challengeConfigGet({
      challengeNumber: msg.delayMillis,
      subredditId: ctx.subredditId,
      redis: ctx.redis,
    })

    const x = getRandomIntBetween(0, challenge.size)
    const y = getRandomIntBetween(0, challenge.size)

    if (!ctx.userId) throw new Error('No user id')
    console.log('claiming cell', x, y)

    await fieldClaimCells({
      coords: [{x, y}],
      challengeNumber: msg.delayMillis,
      ctx,
      userId: T2(ctx.userId),
    })

    return msg
  }
}
