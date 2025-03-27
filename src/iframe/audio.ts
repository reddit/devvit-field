import type {AssetMap} from './asset-map.ts'
import type {Game} from './game/game.ts'

export type Audio = AudioBufferByName & {ctx: AudioContext; gain: GainNode}
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
  const gain = ctx.createGain()
  gain.gain.value = 0.2
  gain.connect(ctx.destination)
  return {
    banned,
    ctx,
    '16ItemsInThe15OrLessAtA60sGroceryStore': items,
    claim,
    claimed,
    gain,
  }
}

export function audioPlayMusic(
  audio: Readonly<Audio>,
  buf: AudioBuffer,
  queue: boolean = true,
  loop: boolean = false,
): void {
  if (!queue && audio.ctx.state !== 'running') return

  const src = audio.ctx.createBufferSource()
  src.buffer = buf
  src.loop = loop

  // Fade in the entire first loop, 16% volume thereafter.
  const gain = audio.ctx.createGain()
  const now = audio.ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.16, now + buf.duration)
  src.connect(gain)

  gain.connect(audio.gain)
  src.start()
}

export function audioPlay(
  game: Game,
  buf: AudioBuffer,
  delayMillis: number = 0,
  queue: 'Drop' | 'Queue' = 'Drop',
): void {
  if (!game.audio || (queue !== 'Queue' && game.audio.ctx.state !== 'running'))
    return

  const src = game.audio.ctx.createBufferSource()
  src.buffer = buf

  const gain = game.audio.ctx.createGain()
  gain.gain.setValueAtTime(0.075, game.audio.ctx.currentTime)
  src.connect(gain)

  gain.connect(game.audio.gain)
  src.start(game.audio.ctx.currentTime + delayMillis / 1000)
}

export function beep(
  audio: Readonly<Audio>,
  type: OscillatorType,
  startHz: number,
  endHz: number,
  duration: number,
  delayMillis: number,
): void {
  if (audio.ctx.state !== 'running') return // prevent queuing sounds.
  const start = audio.ctx.currentTime + delayMillis / 1000
  const end = start + duration

  const oscillator = audio.ctx.createOscillator()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(startHz, start)
  oscillator.frequency.exponentialRampToValueAtTime(endHz, end)

  const gain = audio.ctx.createGain()
  gain.gain.setValueAtTime(0.2, start)
  gain.gain.exponentialRampToValueAtTime(0.01, end)

  oscillator.connect(gain)
  gain.connect(audio.gain)

  oscillator.start(start)
  oscillator.stop(end)
}
