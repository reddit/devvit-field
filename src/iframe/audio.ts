import type {AssetMap} from './asset-map.ts'

export type Audio = AudioBufferByName & {ctx: AudioContext}
export type AudioBufferByName = {
  '16ItemsInThe15OrLessAtA60sGroceryStore': AudioBuffer
}

export async function Audio(assets: Readonly<AssetMap>): Promise<Audio> {
  const ctx = new AudioContext()
  const [items] = await Promise.all([
    ctx.decodeAudioData(assets.audio['16ItemsInThe15OrLessAtA60sGroceryStore']),
  ])
  return {ctx, '16ItemsInThe15OrLessAtA60sGroceryStore': items}
}

export function audioPlay(
  ctx: AudioContext,
  buf: AudioBuffer,
  queue: boolean = false,
  loop: boolean = false,
): void {
  if (!queue && ctx.state !== 'running') return

  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = loop

  // Fade in the entire first loop, 20% volume thereafter.
  const gain = ctx.createGain()
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.2, now + buf.duration)
  src.connect(gain)

  gain.connect(ctx.destination)
  src.start()
}
