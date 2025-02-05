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
