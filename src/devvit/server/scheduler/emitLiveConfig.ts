import {liveSettingsEmitForCurrentInstallationIfNeeded} from '../core/live-settings.ts'
import {type Task, WorkQueue} from './workqueue.ts'

type EmitLiveConfigTask = Task & {
  type: 'EmitLiveConfig'
}

WorkQueue.register<EmitLiveConfigTask>(
  'EmitLiveConfig',
  async (wq: WorkQueue): Promise<void> => {
    await liveSettingsEmitForCurrentInstallationIfNeeded(wq.ctx)
  },
)
