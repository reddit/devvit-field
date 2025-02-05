import type {AssetMap} from './asset-map.ts'

export type Audio = AudioBufferByName & {ctx: AudioContext}
// biome-ignore lint/complexity/noBannedTypes: fill out with sounds needed.
export type AudioBufferByName = {}

export async function Audio(_assets: Readonly<AssetMap>): Promise<Audio> {
  const ctx = new AudioContext()
  // const [hit] = await Promise.all([ctx.decodeAudioData(assets.audio.hit)])
  return {ctx}
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
