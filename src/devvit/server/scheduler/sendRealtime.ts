import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const.js'
import type {DevvitMessage} from '../../../shared/types/message.js'
import type {WorkQueue} from './workqueue.ts'

export async function sendRealtime(
  wq: WorkQueue,
  msg: DevvitMessage,
): Promise<void> {
  await wq.ctx.realtime.send(INSTALL_REALTIME_CHANNEL, msg)
}
