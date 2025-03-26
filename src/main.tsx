import './shared/polyfills/crypto-poly.ts'

import './devvit/server/scheduler/driveLoad.js'
import './devvit/server/scheduler/emitDeltas.js'
import './devvit/server/scheduler/emitLiveConfig.js'
import './devvit/server/scheduler/emitPartitions.js'
import './devvit/server/scheduler/leaderboardUpdate.js'
import './devvit/server/triggers/commentsubmit.js'
import './devvit/server/triggers/install.js'
import './devvit/server/triggers/upgrade.js'

import {
  type Hello,
  HelloDefinition,
  type Metadata,
  type PingMessage,
} from '@devvit/protos'
import {Devvit, SettingScope} from '@devvit/public-api'
import {makeAPIClients} from '@devvit/public-api/apis/makeAPIClients.js'
import {getContextFromMetadata} from '@devvit/public-api/devvit/internals/context.js'
import type {Config} from '@devvit/shared-types/Config.js'
import {DialogWelcomeLoading} from './devvit/components/DialogWelcomeLoading.js'
import {LeaderboardLoading} from './devvit/components/LeaderboardLoading.js'
import {App} from './devvit/components/app.js'
import {blockUsersMenuAction} from './devvit/menu-actions/blockUsers.js'
import {endCurrentChallengeMenuAction} from './devvit/menu-actions/endCurrentChallenge.js'
import {
  flushWorkQueueAction,
  joltWorkQueueAction,
} from './devvit/menu-actions/flushWorkQueue.ts'
import {getDefaultConfigMenuAction} from './devvit/menu-actions/getDefaultConfig.js'
import {makeSuperUserMenuAction} from './devvit/menu-actions/makeSuperUser.js'
import {nukeCellsMenuAction} from './devvit/menu-actions/nukeCells.ts'
import {resetUserGlobalPointCountMenuAction} from './devvit/menu-actions/resetGlobalPointCounter.ts'
import {resetUserStartedPlayingAtMenuAction} from './devvit/menu-actions/resetUserStartedPlayingAt.js'
import {setDefaultConfigMenuAction} from './devvit/menu-actions/setDefaultConfig.js'
import {setUserLevelMenuAction} from './devvit/menu-actions/setUserLevel.js'
import {unblockUsersMenuAction} from './devvit/menu-actions/unblockUsers.js'
import {updateLiveConfigMenuAction} from './devvit/menu-actions/updateLiveConfig.js'
import {
  challengeMakeNew,
  makeFallbackDefaultChallengeConfig,
} from './devvit/server/core/challenge.js'
import {defaultChallengeConfigMaybeGet} from './devvit/server/core/defaultChallengeConfig.js'
import {generateClaim} from './devvit/server/core/loadgen.js'
import {fallbackPixelRatio} from './shared/theme.js'
import {type Level, config2} from './shared/types/level.js'
import {validateChallengeConfig} from './shared/validateChallengeConfig.js'
import {validateFieldArea} from './shared/validateFieldArea.js'

Devvit.configure({http: true, redditAPI: true, redis: true, realtime: true})

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
        ctx.subredditName === config2.leaderboard.subredditName
          ? config2.leaderboard
          : config2.levels.find(lvl => lvl.subredditName === ctx.subredditName)
      if (!lvl)
        throw Error(
          'Cannot find level, please add the subreddit name to the config file, upload, make a post, and fill in the rest of the config to continue.',
        )

      const isLeaderboard =
        ctx.subredditName === config2.leaderboard.subredditName

      const post = await ctx.reddit.submitPost({
        preview: isLeaderboard ? (
          <LeaderboardLoading pixelRatio={fallbackPixelRatio} />
        ) : (
          <DialogWelcomeLoading
            pixelRatio={fallbackPixelRatio}
            level={
              config2.levels.findIndex(
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
Devvit.addMenuItem(nukeCellsMenuAction())
Devvit.addMenuItem(blockUsersMenuAction())
Devvit.addMenuItem(unblockUsersMenuAction())
Devvit.addMenuItem(resetUserStartedPlayingAtMenuAction())
Devvit.addMenuItem(resetUserGlobalPointCountMenuAction())
Devvit.addMenuItem(joltWorkQueueAction())
Devvit.addMenuItem(flushWorkQueueAction())

Devvit.addSettings([
  {
    scope: SettingScope.App,
    name: 'aws-access-key',
    label: 'AWS Access Key',
    type: 'string',
    isSecret: true,
  },
  {
    scope: SettingScope.App,
    name: 'aws-secret',
    label: 'AWS Secret',
    type: 'string',
    isSecret: true,
  },
  {
    scope: SettingScope.App,
    name: 'drive-load-claims-per-sec',
    label:
      'Set to positive number, and scheduled handler will generate this many random claims per second',
    type: 'number',
    defaultValue: 0,
  },
  {
    scope: SettingScope.App,
    name: 'drive-load-stride',
    label:
      'Set to true, and driven load will select cells in order instead of randomly',
    type: 'boolean',
    defaultValue: false,
  },
  {
    scope: SettingScope.App,
    name: 'realtime-batch-enabled',
    label: 'Set to true to reduce realtime publish RPS',
    type: 'boolean',
    defaultValue: true,
  },
  {
    scope: SettingScope.App,
    name: 's3-bucket',
    label: 'S3 bucket',
    type: 'string',
    defaultValue: 'reddit-service-devvit-webview-assets-a1',
  },
  {
    scope: SettingScope.App,
    name: 's3-region',
    label: 'S3 region',
    type: 'string',
    defaultValue: 'us-east-1',
  },
  {
    scope: SettingScope.App,
    name: 's3-path-prefix',
    label: 'S3 path prefix',
    type: 'string',
    defaultValue: 'dev/default',
  },
  {
    scope: SettingScope.App,
    name: 'workqueue-debug',
    label: 'Set to true to enable workqueue debug logging',
    type: 'boolean',
    defaultValue: false,
  },
  {
    scope: SettingScope.App,
    name: 'workqueue-polling-interval-ms',
    label: 'Milliseconds to wait after completing each batch of claimed tasks',
    type: 'number',
    defaultValue: 10,
  },
  {
    scope: SettingScope.App,
    name: 'skip-comment-create',
    label: 'Set to "true" to skip comment creation handling',
    type: 'string',
    defaultValue: 'false',
  },
])

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

    await generateClaim(ctx, msg.delayMillis)

    return msg
  }
}
