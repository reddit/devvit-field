import {fetchAudio, fetchImage} from './utils/fetch-util.ts'
import {retry} from './utils/retry.ts'

export type AssetMap = {
  audio: {
    [name in
      | '16ItemsInThe15OrLessAtA60sGroceryStore'
      | 'claim'
      | 'claimed'
      | 'cool']: ArrayBuffer
  }
  img: {[name in 'atlas']: HTMLImageElement}
}

export async function AssetMap(): Promise<AssetMap> {
  const [atlas, audioCat] = await retry(() =>
    Promise.all([
      // Align to preloads in index.html.
      fetchImage('assets/atlas.webp'),
      fetchAudio('assets/audio.cat'),
    ]),
  )

  return {
    audio: {
      '16ItemsInThe15OrLessAtA60sGroceryStore': audioCat.slice(0, 85824),
      claim: audioCat.slice(85824, 98557),
      claimed: audioCat.slice(98557, 111420),
      cool: audioCat.slice(111420, 121959),
    },
    img: {atlas},
  }
}
