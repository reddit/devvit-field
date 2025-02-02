import {fontFamily} from '../shared/theme.ts'
import {canvasSubimg} from './canvas/canvas-util.ts'
import {fetchAudio, fetchImage} from './utils/fetch-util.ts'
import {retry} from './utils/retry.ts'

/** Assets required to load before showing anything besides index.html. */
export type PreloadAssetMap = {loading: HTMLImageElement}

export type AssetMap = {
  audio: {[name in 'hit']: ArrayBuffer}
  font: FontFace
  img: {[name in 'bg']: HTMLImageElement}
}

export async function PreloadAssetMap(): Promise<PreloadAssetMap> {
  return {loading: await retry(() => fetchImage('assets/loading.webp'))}
}

export async function AssetMap(): Promise<AssetMap> {
  const [audioCat, atlas, font] = await retry(() =>
    Promise.all([
      // Align to preloads in index.html.
      fetchAudio('assets/audio.cat'),
      fetchImage('assets/atlas.webp'),
      new FontFace(fontFamily, 'url(assets/mem-prop-5x6.ttf)').load(),
    ]),
  )

  const scratch = document.createElement('canvas')
  const ctx = scratch.getContext('2d')
  if (!ctx) throw Error('no context')

  const bg = await canvasSubimg(
    atlas,
    {x: 0, y: 0, w: 256, h: 256},
    ctx,
    scratch,
  )

  const hit = audioCat.slice(321525, 329946)

  return {audio: {hit}, img: {bg}, font}
}
