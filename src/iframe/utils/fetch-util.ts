export async function fetchAudio(url: string): Promise<ArrayBuffer> {
  const rsp = await fetch(url, {headers: {accept: 'audio/mpeg'}})
  if (!rsp.ok)
    throw Error(`fetch error ${rsp.status}: ${rsp.statusText} for ${url}`)
  const type = rsp.headers.get('Content-Type')
  if (!type?.startsWith(devMode ? 'application/octet' : 'audio/opus'))
    throw Error(`bad fetch response type ${type} for ${url}`)
  return await rsp.arrayBuffer()
}

export function fetchImage(url: string): Promise<HTMLImageElement> {
  return new Promise((fulfil, reject) => {
    const img = new Image()
    img.onload = () => fulfil(img)
    img.onerror = () => reject(Error(`image load error for ${url}`))
    img.src = url
  })
}
