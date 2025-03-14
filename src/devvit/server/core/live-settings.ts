import type {Context} from '@devvit/public-api'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const'
import {
  type AppConfig,
  getDefaultAppConfig,
} from '../../../shared/types/app-config.js'
import type {ConfigUpdateMessage} from '../../../shared/types/message'

// Global settings key
const globalSettingsKey: string = 'global:settings'

// Global settings sequence number. This gets incremented every time
// settings is updated, regardless of the originating installation.
const globalSettingsSeqNoKey: string = 'global:settings:seqno'

// Installation settings key
const installationSettingsKey: string = 'installation:settings'

// Current installation's sequence number. If this is ever behind
// the global sequence number, the installation should emit a config update
// and increment this.
const currentInstallSeqnoKey: string = 'installation:settings:seqno'

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
  const [newSeqNo, _unused, _unused2] = await Promise.all([
    ctx.redis.global.incrBy(globalSettingsSeqNoKey, 1),
    ctx.redis.global.set(globalSettingsKey, JSON.stringify(globalSettings)),
    ctx.redis.set(
      installationSettingsKey,
      JSON.stringify(installationSettings),
    ),
  ])

  // Emit to the current installation, and update the current installation's
  // settings sequence number
  await Promise.all([
    ctx.redis.set(currentInstallSeqnoKey, `${newSeqNo}`),
    ctx.realtime.send(INSTALL_REALTIME_CHANNEL, {
      type: 'ConfigUpdate',
      config: newSettings,
    } satisfies ConfigUpdateMessage),
  ])
}

export async function liveSettingsEmitForCurrentInstallationIfNeeded(
  ctx: Pick<Context, 'redis' | 'realtime'>,
): Promise<void> {
  const globalSeqNo =
    Number(await ctx.redis.global.get(globalSettingsSeqNoKey)) || 0
  const currentInstallSeqNo =
    Number(await ctx.redis.get(currentInstallSeqnoKey)) || 0
  if (globalSeqNo >= currentInstallSeqNo) {
    return
  }

  const currentSettings = await liveSettingsGet(ctx)
  await ctx.realtime.send(INSTALL_REALTIME_CHANNEL, {
    type: 'ConfigUpdate',
    config: currentSettings,
  } satisfies ConfigUpdateMessage)
  // Update Redis _after_ we have a successful realtime send
  await ctx.redis.set(currentInstallSeqnoKey, `${globalSeqNo}`)
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
