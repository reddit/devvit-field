import type {AssetMap} from './asset-map.ts'

export type Audio = AudioBufferByName & {ctx: AudioContext}
export type AudioBufferByName = {hit: AudioBuffer}

export async function Audio(assets: Readonly<AssetMap>): Promise<Audio> {
  const ctx = new AudioContext()
  const [hit] = await Promise.all([ctx.decodeAudioData(assets.audio.hit)])
  return {ctx, hit}
}

export function audioPlay(
  ctx: AudioContext,
  buf: AudioBuffer,
  queue: boolean = false,
): void {
  if (!queue && ctx.state !== 'running') return

  const src = ctx.createBufferSource()
  src.buffer = buf
  src.connect(ctx.destination)
  src.start()
}
