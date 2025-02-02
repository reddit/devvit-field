import type {Box} from '../../shared/types/2d.ts'
import {fetchImage} from '../utils/fetch-util.ts'

/** Draws a box of img to scatch and generates a new image. */
export async function canvasSubimg(
  img: Readonly<HTMLImageElement>,
  box: Readonly<Box>,
  ctx: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
): Promise<HTMLImageElement> {
  scratch.width = box.w
  scratch.height = box.h
  ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h)

  using blob = await canvasToBlobURI(scratch)
  return await fetchImage(blob.uri)
}

/**
 * Draws a canvas to a blob URI. It cannot be uploaded but is faster than
 * base64-encoding.
 */
export function canvasToBlobURI(
  canvas: HTMLCanvasElement,
): Promise<Disposable & {uri: string}> {
  return new Promise((fulfil, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        const img = {
          [Symbol.dispose]() {
            URL.revokeObjectURL(this.uri)
          },
          uri: URL.createObjectURL(blob),
        }
        fulfil(img)
      } else reject(Error('no blob'))
    }, 'image/png')
  })
}
