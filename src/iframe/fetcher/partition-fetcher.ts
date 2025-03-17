import {
  DeltaCodec,
  type DeltaSnapshotKey,
  type S3Kind,
  fieldS3URL,
  partitionPeriod,
} from '../../shared/codecs/deltacodec.ts'
import {MapCodec} from '../../shared/codecs/mapcodec.ts'
import {makePartitionKey} from '../../shared/partition.ts'
import {
  type Box,
  type PartitionKey,
  type XY,
  boxHits,
} from '../../shared/types/2d.ts'
import {
  type AppConfig,
  getDefaultAppConfig,
} from '../../shared/types/app-config.ts'
import type {FieldConfig} from '../../shared/types/field-config.ts'
import type {Cell, Delta} from '../../shared/types/field.ts'
import type {PartitionUpdate} from '../../shared/types/message.ts'
import {type T5, noT5} from '../../shared/types/tid.ts'
import {type UTCMillis, utcMillisNow} from '../../shared/types/time.ts'
import type {Cam} from '../renderer/cam.ts'

// to-do: one interface.
export type RenderPatch = (
  boxes: readonly Readonly<Delta>[],
  partXY: Readonly<XY>,
  isFromP1: boolean,
) => void
export type RenderReplace = (
  boxes: IterableIterator<Readonly<Cell>>,
  partXY: Readonly<XY>,
) => void

type Part = {
  /**
   * Missed updates since last replace. Reset when replaced. Necessary since
   * seq - written doesn't aggregate. Excludes skips.
   */
  dropped: number
  /** Last fetch attempt. */
  fetched: UTCMillis | 0
  /**
   * The latest sequence being fetched. Only one in-flight request allowed.
   * noSeq on un/successful completion. Use pending and written to determine
   * when to fetch.
   */
  pending: number
  /** The last replace sequence written. */
  replaced: number
  /**
   * The latest available sequence known for the partition. This is written by
   * messages received and has nothing to do with fetch state. Use to identify
   * fetch target and dropped messages.
   */
  seq: number
  /**
   * The last write to seq by message or artificially. Updated when no change
   * too.
   */
  seqUpdated: UTCMillis | 0
  /**
   * The latest sequence written to a partition (could be patch or replace). Use
   * pending and written to determine when to fetch.
   */
  written: number
  readonly xy: Readonly<XY>
}

const pollIntervalMillis: number = 250
const noSeq: number = -1

class FetchError404 extends Error {}

/**
 * Accepts new realtime messages and initiates partition patch and replace
 * fetches as appropriate for the current viewport. Guesses when realtime is
 * silent for too long.
 */
export class PartitionFetcher {
  #abortCtrl: AbortController = new AbortController()
  readonly #cam: Readonly<Cam>
  /** Camera partitions rectangle. */
  #camPartBox: Readonly<Box> = {x: 0, y: 0, w: 0, h: 0}
  #challenge: number = 0
  #config: Readonly<FieldConfig> | undefined // Implicitly used to test init.
  #live: Readonly<AppConfig> = getDefaultAppConfig()
  #pathPrefix: string = ''
  /** Greatest sequence number received across partitions. Never artificial. */
  #maxSeq: number = noSeq
  /** Time of last maxSeq write. */
  #maxSeqUpdated: UTCMillis | 0 = 0
  #part: {[key: PartitionKey]: Part} = {}
  /** Number of inflight requests. */
  #pending: number = 0
  #poller: number = 0
  #renderPatch: RenderPatch
  #renderReplace: RenderReplace
  #t5: T5 = noT5

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
    this.#abortCtrl.abort()
    this.#config = undefined
    this.#maxSeq = noSeq
    this.#maxSeqUpdated = 0
    this.#part = {}
  }

  /** Deregister sequence timer. */
  deregister(): void {
    clearInterval(this.#poller)
    this.#poller = 0
  }

  /** Called on initial render and reinit to initialize the entire field. */
  init(
    config: Readonly<FieldConfig>,
    t5: T5,
    key: Readonly<DeltaSnapshotKey> | undefined,
  ): void {
    this.#abortCtrl = new AbortController()
    this.#config = config
    this.#t5 = t5

    if (key) this.#recordMessage(key)
  }

  /** Called when a new partition is available for download by realtime. */
  message(update: Readonly<PartitionUpdate>): void {
    this.#recordMessage(update.key)

    // if (update.key.kind === 'deltas')
    //   console.log(
    //     `message xy=${update.key.partitionXY.x}-${update.key.partitionXY.y} seq=${update.key.sequenceNumber} noChange=${update.key.noChange}`,
    //   )
  }

  /** Register sequence timer. */
  register(): void {
    this.#poller = setInterval(this.#onPoll, pollIntervalMillis)
  }

  /** Adjust live config for future evaluations. */
  setLiveConfig(config: Readonly<AppConfig>): void {
    this.#live = config
  }

  /** Called every render loop to respond to camera changes.  */
  update(): void {
    if (!this.#config) return // Not initialized.

    this.#camPartBox = camPartBox(this.#cam, this.#config)
    for (const xy of boxParts(this.#camPartBox, this.#config.partSize)) {
      const partKey = makePartitionKey(xy)
      const part = this.#part[partKey]
      if (!part) continue // to-do: fetch current sequence and then fetch part.
      if (this.#isPartFetchable(part)) void this.#fetchPart(part) // to-do: await on separate thread.
    }
  }

  async #fetchPart(part: Part): Promise<void> {
    const partitionOffset = part.seq % partitionPeriod
    let kind: S3Kind = 'deltas'
    if (
      (part.dropped > this.#live.globalFetcherMaxDroppedPatches ||
        part.seq - part.replaced >
          this.#live.globalFetcherMandatoryReplaceSequencePeriod) &&
      part.replaced !== part.seq - partitionOffset &&
      (part.written === noSeq ||
        part.dropped - partitionOffset <
          this.#live.globalFetcherMaxDroppedPatches)
    )
      // Partition offset may be > max dropped requiring a subsequent replace
      // request. This seems better than to keep downloading deltas hoping for a
      // better replace.
      kind = 'partition'

    const key = {
      challengeNumber: this.#challenge,
      kind,
      noChange: false, // to-do: fix type.
      partitionXY: part.xy,
      pathPrefix: this.#pathPrefix,
      sequenceNumber: part.seq - (kind === 'deltas' ? 0 : partitionOffset),
      subredditId: this.#t5,
    }

    const prevDropped = part.dropped
    part.fetched = utcMillisNow()
    part.pending = key.sequenceNumber
    this.#pending++

    // console.log(`fetch xy=${part.xy.x}-${part.xy.y} seq=${key.sequenceNumber}`)

    let rsp
    try {
      rsp = await fetchPart(key, this.#abortCtrl)
    } catch (err) {
      // Don't retry. Assume another update is coming soon.
      if (!this.#abortCtrl.signal.aborted && !(err instanceof FetchError404))
        console.warn(err)
      return
    } finally {
      part.pending = noSeq
      this.#pending--
    }

    if (kind === 'partition') {
      part.dropped = Math.max(0, part.dropped - (prevDropped - partitionOffset))
      part.replaced = key.sequenceNumber
    }
    part.written = Math.max(part.written, key.sequenceNumber)

    // Applying never resets boxes so order is irrelevant. Always accept old
    // responses.
    // to-do: what to do about moderation?

    if (!this.#config) return
    if (kind === 'deltas') {
      const codec = new DeltaCodec(part.xy, this.#config.partSize)
      this.#renderPatch(codec.decode(new Uint8Array(rsp)), part.xy, false)
    } else {
      const codec = new MapCodec()
      this.#renderReplace(codec.decode(new Uint8Array(rsp)), part.xy)
    }
  }

  #isPartFetchable(part: Readonly<Part>): boolean {
    return (
      this.#poller !== 0 && // Not paused.
      // Not back to back.
      utcMillisNow() - part.fetched > this.#live.globalFetcherFetchRestMillis &&
      // Not maxed out.
      this.#pending < this.#live.globalFetcherMaxParallelS3Fetches &&
      part.pending === noSeq && // Not pending.
      part.written < part.seq && // New data available.
      this.#isPartVisible(part) // Not hidden.
    )
  }

  #isPartVisible(part: Readonly<Part>): boolean {
    if (!this.#camPartBox || !this.#config) return false
    return boxHits(this.#camPartBox, {
      x: part.xy.x * this.#config.partSize,
      y: part.xy.y * this.#config.partSize,
    })
  }

  /** Called when the timer checks in. */
  #onPoll = (): void => {
    if (!this.#config || this.#maxSeq === noSeq) return

    const now = utcMillisNow()
    const maxSeqAge = now - this.#maxSeqUpdated
    let seq = this.#maxSeq
    if (
      this.#maxSeqUpdated &&
      maxSeqAge > this.#live.globalFetcherMaxRealtimeSilenceMillis
    ) {
      seq =
        this.#maxSeq +
        Math.max(
          0,
          Math.trunc(
            (maxSeqAge + this.#live.globalFetcherGuessOffsetMillis) / 1000,
          ),
        )
      // console.log(
      //   `guessing seq=${seq} maxSeq=${this.#maxSeq} age=${maxSeqAge} offset=${this.#live.globalFetcherGuessOffsetMillis}`,
      // )
    }

    for (const xy of boxParts(this.#camPartBox, this.#config.partSize)) {
      const partKey = makePartitionKey(xy)
      const part = (this.#part[partKey] ??= Part(xy))
      if (now - part.seqUpdated > this.#live.globalFetcherMaxSeqAgeMillis) {
        // console.log(
        //   `artificial sequence xy=${xy.x}-${xy.y} old=${part.seq} new=${this.#maxSeq}`,
        // )
        part.seq = seq
        part.seqUpdated = now
      }
    }
  }

  #recordMessage(key: Readonly<DeltaSnapshotKey>): Part {
    this.#challenge = Math.max(this.#challenge, key.challengeNumber)
    this.#pathPrefix = key.pathPrefix

    const partKey = makePartitionKey(key.partitionXY)
    const part = (this.#part[partKey] ??= Part(key.partitionXY))

    // Replace messages are expected to duplicate patch messages but do not
    // correctly post noChange and may be out of sync with patches. It's
    // possible to only receive a replace and no delta but deduplicating
    // reliably would be hard. The sequence number could be updated to the
    // greatest seen but then artificial sequences would need to be tracked
    // separately so that part.seq could always be the max.
    if (key.kind !== 'deltas') return part

    // Record dropped before fetching. Realtime updates always come in order
    // but responses do not. noSeq is -1.
    part.dropped +=
      key.sequenceNumber -
      Math.min(key.sequenceNumber, part.seq + (key.noChange ? 1 : 0))

    const now = utcMillisNow()
    if (!key.noChange) part.seq = key.sequenceNumber
    part.seqUpdated = now
    if (key.sequenceNumber > this.#maxSeq) {
      this.#maxSeq = key.sequenceNumber
      this.#maxSeqUpdated = now
    }

    return part
  }
}

function* boxParts(box: Readonly<Box>, partSize: number): IterableIterator<XY> {
  for (let y = box.y; y < box.y + box.h; y += partSize)
    for (let x = box.x; x < box.x + box.w; x += partSize)
      yield {x: x / partSize, y: y / partSize}
}

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

async function fetchPart(
  key: Readonly<DeltaSnapshotKey>,
  ctrl: AbortController,
): Promise<ArrayBuffer> {
  const url = fieldS3URL(key)
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

function Part(xy: Readonly<XY>): Part {
  return {
    dropped: 0,
    fetched: 0,
    pending: noSeq,
    replaced: noSeq,
    seq: noSeq,
    seqUpdated: 0,
    written: noSeq,
    xy,
  }
}
