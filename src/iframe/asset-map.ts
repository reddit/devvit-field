import {fetchImage} from './utils/fetch-util.ts'
import {retry} from './utils/retry.ts'

export type AssetMap = {
  audio: {[name in never]: ArrayBuffer}
  img: {[name in 'atlas']: HTMLImageElement}
}

export async function AssetMap(): Promise<AssetMap> {
  const [atlas] = await retry(() =>
    Promise.all([
      // Align to preloads in index.html.
      fetchImage('assets/atlas.webp'),
    ]),
  )

  const scratch = document.createElement('canvas')
  const ctx = scratch.getContext('2d')
  if (!ctx) throw Error('no context')

  // const hit = audioCat.slice(321525, 329946)

  return {audio: {}, img: {atlas}}
}
