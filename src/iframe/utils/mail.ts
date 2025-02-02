import type {IframeMessage} from '../../shared/types/message.ts'
import type {PreloadGame} from '../game/game.ts'

export function postIframeMessage(
  _game: Readonly<PreloadGame>,
  msg: Readonly<IframeMessage>,
): void {
  // to-do: peer messages: game.devPeerChan?.postMessage(msg)
  parent.postMessage(msg, document.referrer || '*')
}
