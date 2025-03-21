import type {DeltaSnapshotKey} from '../../shared/codecs/deltacodec.ts'
import {makePartitionKey} from '../../shared/partition.ts'
import {
  type Box,
  type PartitionKey,
  type XY,
  boxAssign,
} from '../../shared/types/2d.ts'
import {
  type AppConfig,
  getDefaultAppConfig,
} from '../../shared/types/app-config.ts'
import type {FieldConfig} from '../../shared/types/field-config.ts'
import type {Delta} from '../../shared/types/field.ts'
import type {PartitionUpdate} from '../../shared/types/message.ts'
import {T5, noT5} from '../../shared/types/tid.ts'
import {type UTCMillis, utcMillisNow} from '../../shared/types/time.ts'
import {V4} from '../../shared/types/v4.ts'
import type {Cam} from '../renderer/cam.ts'
import type {
  PartDataFetcherMessage,
  PartDataWorkerMessage,
} from './part-data-message.ts'
import {PartData} from './part-data.ts'
import {type NoSeq, Seq, noSeq} from './seq.ts'

export type RenderPatch = (
  boxes: readonly Readonly<Delta>[],
  partXY: Readonly<XY>,
) => void
export type RenderReplace = (
  boxes: Readonly<ArrayBuffer>,
  partXY: Readonly<XY>,
) => void

type PartWorker = {
  readonly id: V4
  state: 'Free' | 'Fetching' | 'Dying'
  readonly worker: Omit<Worker, 'postMessage'> & {
    postMessage(msg: PartDataFetcherMessage): void
  }
}

/**
 * Accepts new realtime messages and initiates partition patch and replace
 * fetches as appropriate for the current viewport. Guesses when realtime is
 * silent for too long.
 */
export class PartDataFetcher {
  readonly #cam: Readonly<Cam>
  /** Camera partitions rectangle in pixel coords. */
  readonly #camPartBox: Readonly<Box> = {x: 0, y: 0, w: 0, h: 0}
  #challenge: number = 0
  #config: Readonly<FieldConfig> | undefined // Implicitly used to test init.
  readonly #live: Readonly<AppConfig> = getDefaultAppConfig()
  /** Greatest sequence number received across partitions. Never artificial. */
  #maxSeq: Seq | NoSeq = noSeq
  /** Time of last maxSeq write. */
  #maxSeqUpdated: UTCMillis | 0 = 0
  #part: {[key: PartitionKey]: PartData} = {}
  #pathPrefix: string = ''
  #resumed: boolean = false
  readonly #renderPatch: RenderPatch
  readonly #renderReplace: RenderReplace
  #t5: T5 = noT5
  readonly #workers: PartWorker[] = []

  constructor(
    cam: Readonly<Cam>,
    renderPatch: RenderPatch,
    renderReplace: RenderReplace,
  ) {
    this.#cam = cam
    this.#renderPatch = renderPatch
    this.#renderReplace = renderReplace
  }

  /** Called on reinit to clear any pending fetches. */
  deinit(): void {
    for (const worker of this.#workers)
      if (worker.state !== 'Dying') worker.worker.postMessage({type: 'Kill'})
    this.#config = undefined
    this.#maxSeq = noSeq
    this.#maxSeqUpdated = 0
    this.#part = {}
  }

  /** Called on initial render and reinit to initialize the entire field. */
  init(
    config: Readonly<FieldConfig>,
    key: Readonly<DeltaSnapshotKey> | undefined,
  ): void {
    this.#config = config
    if (key) this.#recordMessage(key)
    else if (this.#live.globalPDFDebug) console.debug('[pdf] no initial key')
  }

  /** Called when a new partition is available for download by realtime. */
  message(update: Readonly<PartitionUpdate>): void {
    this.#recordMessage(update.key)
  }

  pause(): void {
    this.#resumed = false
  }

  resume(): void {
    this.#resumed = true
  }

  /** Adjust live config for future evaluations. */
  setLiveConfig(live: Readonly<AppConfig>): void {
    Object.assign(this.#live, live)

    let living = this.#workers.reduce(
      (sum, worker) => sum + (worker.state === 'Dying' ? 0 : 1),
      0,
    )
    while (living > live.globalPDFMaxParallelFetches) {
      const worker = this.#workers.find(worker => worker.state !== 'Dying')
      if (!worker) break
      worker.worker.postMessage({type: 'Kill'})
      living--
    }
    while (living < live.globalPDFMaxParallelFetches) {
      this.#workers.push(this.#newWorker())
      living++
    }
  }

  /** Called every render loop to respond to camera changes.  */
  update(): void {
    if (!this.#config) return // Not initialized.

    boxAssign(this.#camPartBox, camPartBox(this.#cam, this.#config))
    const now = utcMillisNow()
    for (const partXY of boxParts(this.#camPartBox, this.#config.partSize)) {
      const part = this.#part[makePartitionKey(partXY)]
      if (part) this.#fetchPart(now, part)
    }
  }

  #fetchPart(now: UTCMillis, part: PartData): void {
    if (!this.#config) return // Not init.
    if (!this.#resumed) return

    const worker = this.#workers.find(worker => worker.state === 'Free')
    if (!worker) return

    const seq = part.fetch(this.#maxSeq, this.#maxSeqUpdated, now)
    if (!seq) return

    const key = {
      challengeNumber: this.#challenge,
      kind: seq.kind,
      noChange: false, // to-do: fix type.
      partitionXY: part.partXY,
      pathPrefix: this.#pathPrefix,
      sequenceNumber: seq.seq,
      subredditId: this.#t5,
    }

    if (this.#live.globalPDFDebug > 2)
      console.debug(
        `[pdf] fetch xy=${part.partXY.x}-${part.partXY.y} seq=${seq.seq}${seq.kind === 'deltas' ? 'p' : 'r'}`,
      )

    worker.state = 'Fetching'
    worker.worker.postMessage({
      type: 'Fetch',
      key,
      partSize: this.#config.partSize,
      workerID: worker.id,
    })
  }

  #newWorker(): PartWorker {
    const worker = {
      id: V4(),
      state: 'Free',
      worker: new Worker('/part-data-worker.js', {
        name: 'PartDataWorker',
        type: 'module',
      }),
    } as const
    worker.worker.addEventListener('message', this.#onWorkerMsg)
    return worker
  }

  #onWorkerMsg = (ev: MessageEvent<PartDataWorkerMessage>): void => {
    if (!this.#config) return // No init.
    if (!ev.isTrusted) return

    const msg = ev.data
    if (this.#live.globalPDFDebug > 4)
      console.debug(`worker → iframe msg=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'Cells': {
        const {cells, key, workerID} = msg
        const worker = this.#workers.find(worker => worker.id === workerID)
        if (worker) {
          if (worker.state === 'Dying')
            worker.worker.removeEventListener('message', this.#onWorkerMsg)
          else worker.state = 'Free'
        }

        const part = this.#part[makePartitionKey(key.partitionXY)]
        if (!part) break

        part.resolve(utcMillisNow(), !!cells)

        if (!cells) break

        // Applying never resets boxes so order is irrelevant. Always accept old
        // responses.
        if (key.kind === 'deltas')
          this.#renderPatch(cells as Delta[], part.partXY)
        else this.#renderReplace(cells as ArrayBuffer, part.partXY)
        break
      }
      default:
        msg.type satisfies never
    }
  }

  #recordMessage(key: Readonly<DeltaSnapshotKey>): void {
    // to-do: when challenge changes, call init.
    if (!this.#config) return
    this.#challenge = Math.max(this.#challenge, key.challengeNumber)
    this.#pathPrefix = key.pathPrefix
    this.#t5 = T5(key.subredditId)

    const now = utcMillisNow()

    const partKey = makePartitionKey(key.partitionXY)
    const part = (this.#part[partKey] ??= new PartData(
      this.#camPartBox,
      this.#live,
      this.#config.partSize,
      key.partitionXY,
    ))
    part.message(key, now)

    if (key.sequenceNumber > this.#maxSeq) {
      this.#maxSeq = Seq(key.sequenceNumber)
      this.#maxSeqUpdated = now
    }
  }
}

function* boxParts(box: Readonly<Box>, partSize: number): IterableIterator<XY> {
  for (let y = box.y; y < box.y + box.h; y += partSize)
    for (let x = box.x; x < box.x + box.w; x += partSize)
      yield {x: x / partSize, y: y / partSize}
}

/** @internal */
export function camPartBox(
  cam: Readonly<Cam>,
  config: Readonly<FieldConfig>,
): Box {
  const borderW = 32 // In boxes / pixels.
  const size = config.partSize
  // cam.x/y/w/h is scaled by cam.scale and in level coordinates.
  // cam.fieldScale is pixels per level pixel.
  // cam.w/h is the size of the parent.
  // to-do: review cam.x/y considers cam.scale.
  const start = {
    x: Math.max(0, Math.floor((cam.x / cam.scale - borderW) / size) * size),
    y: Math.max(0, Math.floor((cam.y / cam.scale - borderW) / size) * size),
  }
  const end = {
    x: Math.max(
      0,
      Math.min(
        config.wh.w,
        Math.ceil(
          (cam.x / cam.scale + cam.w / cam.scale / cam.fieldScale) / size,
        ) * size,
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        config.wh.h,
        Math.ceil(
          (cam.y / cam.scale + cam.h / cam.scale / cam.fieldScale) / size,
        ) * size,
      ),
    ),
  }
  return {x: start.x, y: start.y, w: end.x - start.x, h: end.y - start.y}
}
