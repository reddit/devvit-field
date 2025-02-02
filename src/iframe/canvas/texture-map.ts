import type {AssetMap} from '../asset-map.ts'
import type {C2D} from './c2d.ts'

export type TextureMap = {bg: CanvasPattern}

export function TextureMap(
  c2d: C2D,
  img: Readonly<AssetMap['img']>,
): TextureMap | undefined {
  const bg = c2d.createPattern(img.bg, 'repeat')
  if (!bg) return
  return {bg}
}
