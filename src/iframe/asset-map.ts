import {fetchAudio, fetchImage} from './utils/fetch-util.ts'
import {retry} from './utils/retry.ts'

export type AssetMap = {
  audio: {
    [name in
      | '16ItemsInThe15OrLessAtA60sGroceryStore'
      | 'banned'
      | 'claim'
      | 'claimed']: ArrayBuffer
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
      banned: audioCat.slice(85824, 85824 + 16867),
      claim: audioCat.slice(85824 + 16867, 85824 + 16867 + 12733),
      claimed: audioCat.slice(
        85824 + 16867 + 12733,
        85824 + 16867 + 12733 + 12863,
      ),
    },
    img: {atlas},
  }
}
