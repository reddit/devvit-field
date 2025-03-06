import type {Context} from '@devvit/public-api'
import {GLOBAL_REALTIME_CHANNEL} from '../../../shared/const'
import {
  type AppConfig,
  getDefaultAppConfig,
} from '../../../shared/types/app-config.js'
import type {ConfigUpdateMessage} from '../../../shared/types/message'

// Global settings key
const globalSettingsKey = 'global:settings' as const

// Installation settings key
const installationSettingsKey = 'installation:settings' as const

export async function liveSettingsUpdate(
  ctx: Pick<Context, 'redis' | 'realtime'>,
  newSettings: AppConfig,
): Promise<void> {
  const globalSettings: {[key: string]: number} = {}
  const installationSettings: {[key: string]: number} = {}
  for (const key in newSettings) {
    if (key.startsWith('global')) {
      globalSettings[key] = newSettings[key as keyof AppConfig]
    } else {
      installationSettings[key] = newSettings[key as keyof AppConfig]
    }
  }

  // Store in Redis, _then_ send to realtime to avoid client race condition.
  await Promise.all([
    ctx.redis.global.set(globalSettingsKey, JSON.stringify(globalSettings)),
    ctx.redis.set(
      installationSettingsKey,
      JSON.stringify(installationSettings),
    ),
  ])

  const configRealtimeMessage: ConfigUpdateMessage = {
    type: 'ConfigUpdate',
    config: newSettings,
  }

  // TODO: does this only send within the current installation?
  // If so, do we really have a way to configure global settings at all???
  // I guess that would just need a cron, with a counter per installation.
  await ctx.realtime.send(GLOBAL_REALTIME_CHANNEL, configRealtimeMessage)
  console.log('Settings changed and sent:', newSettings)
}

export async function liveSettingsGet(
  ctx: Pick<Context, 'redis'>,
): Promise<AppConfig> {
  const [globalSettingsJson, installationSettingsJson] = await Promise.all([
    ctx.redis.global.get(globalSettingsKey),
    ctx.redis.get(installationSettingsKey),
  ])

  // Order of precedence: installation settings > global settings > default values
  return {
    ...getDefaultAppConfig(),
    ...JSON.parse(globalSettingsJson || '{}'),
    ...JSON.parse(installationSettingsJson || '{}'),
  }
}
