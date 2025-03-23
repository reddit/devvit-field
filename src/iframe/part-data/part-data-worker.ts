import {
  DeltaCodec,
  type DeltaSnapshotKey,
  fieldS3URL,
} from '../../shared/codecs/deltacodec.ts'
import {MapCodec} from '../../shared/codecs/mapcodec.ts'
import type {Delta} from '../../shared/types/field.ts'
import {
  fieldArrayColorBan,
  fieldArrayColorHidden,
  fieldArraySetTeam,
} from '../renderer/field-array.ts'
import type {
  PartDataFetcherMessage,
  PartDataWorkerMessage,
} from './part-data-message.ts'

console.log('part-data-worker')

class FetchError404 extends Error {}

class PartitionWorker {
  readonly #abortCtrl: AbortController = new AbortController()

  deregister(): void {
    removeEventListener('message', this.#onMsg)
  }

  register(): void {
    addEventListener('message', this.#onMsg)
  }

  #onMsg = async (ev: MessageEvent<PartDataFetcherMessage>): Promise<void> => {
    if (!ev.isTrusted) return

    const msg = ev.data
    // console.debug(`iframe → worker msg=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'Fetch': {
        const {key, partSize, workerID} = msg
        let rsp
        let is404Err = false
        try {
          rsp = await fetchPart(key, this.#abortCtrl)
        } catch (err) {
          is404Err = err instanceof FetchError404
          // Don't retry. Assume another update is coming soon.
          if (
            !this.#abortCtrl.signal.aborted &&
            !(err instanceof FetchError404)
          )
            console.warn(err)
        }

        let cells: Delta[] | ArrayBuffer | undefined
        if (rsp) {
          if (key.kind === 'deltas') {
            const codec = new DeltaCodec(key.partitionXY, partSize)
            cells = codec.decode(new Uint8Array(rsp))
          } else {
            const codec = new MapCodec()
            const buf = new Uint8Array(partSize * partSize)
            let i = 0
            for (const cell of codec.decode(new Uint8Array(rsp))) {
              if (!cell) buf[i] = fieldArrayColorHidden
              else if (cell.isBan) buf[i] = fieldArrayColorBan
              else fieldArraySetTeam(buf, i, cell.team)
              i++
            }
            cells = buf.buffer
          }
        }

        postMessage({type: 'Cells', cells, key, workerID, is404Err})

        break
      }
      case 'Kill':
        this.#abortCtrl.abort()
        this.deregister()
        setTimeout(close, 1000)
        break
      default:
        msg satisfies never
    }
  }
}

async function fetchPart(
  key: Readonly<DeltaSnapshotKey>,
  ctrl: AbortController,
): Promise<ArrayBuffer> {
  const url = fieldS3URL(key)
  // console.debug(`fetch ${url}`)
  const rsp = await fetch(url, {
    headers: {accept: 'application/binary'},
    signal: ctrl.signal,
  })
  if (rsp.status === 404) throw new FetchError404()
  if (!rsp.ok)
    throw Error(`part fetch error ${rsp.status}: ${rsp.statusText} for ${url}`)
  const type = rsp.headers.get('Content-Type')
  if (!type?.startsWith('application/binary'))
    throw Error(`bad part fetch response type ${type} for ${url}`)
  return await rsp.arrayBuffer()
}

function postMessage(msg: PartDataWorkerMessage): void {
  globalThis.postMessage(
    msg,
    msg.cells instanceof ArrayBuffer ? [msg.cells] : [],
  )
}

const worker = new PartitionWorker()
worker.register()
