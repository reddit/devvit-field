import type {AssetMap} from './asset-map.ts'
import type {Game} from './game/game.ts'

export type Audio = AudioBufferByName & {ctx: AudioContext}
export type AudioBufferByName = {
  [name in
    | '16ItemsInThe15OrLessAtA60sGroceryStore'
    | 'banned'
    | 'claim'
    | 'claimed']: AudioBuffer
}

export async function Audio(assets: Readonly<AssetMap>): Promise<Audio> {
  const ctx = new AudioContext()
  const [items, banned, claim, claimed] = await Promise.all([
    ctx.decodeAudioData(assets.audio['16ItemsInThe15OrLessAtA60sGroceryStore']),
    ctx.decodeAudioData(assets.audio.banned),
    ctx.decodeAudioData(assets.audio.claim),
    ctx.decodeAudioData(assets.audio.claimed),
  ])
  return {
    banned,
    ctx,
    '16ItemsInThe15OrLessAtA60sGroceryStore': items,
    claim,
    claimed,
  }
}

export function audioPlayMusic(
  ctx: AudioContext,
  buf: AudioBuffer,
  queue: boolean = true,
  loop: boolean = false,
): void {
  if (!queue && ctx.state !== 'running') return

  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = loop

  // Fade in the entire first loop, 16% volume thereafter.
  const gain = ctx.createGain()
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.16, now + buf.duration)
  src.connect(gain)

  gain.connect(ctx.destination)
  src.start()
}

export function audioPlay(
  game: Game,
  buf: AudioBuffer,
  delayMillis: number = 0,
  queue: 'Drop' | 'Queue' = 'Drop',
): void {
  if (queue !== 'Queue' && game.ac.state !== 'running') return

  const src = game.ac.createBufferSource()
  src.buffer = buf

  const gain = game.ac.createGain()
  gain.gain.setValueAtTime(0.075, game.ac.currentTime)
  src.connect(gain)

  gain.connect(game.ac.destination)
  src.start(game.ac.currentTime + delayMillis / 1000)
}
