import {
  DeltaCodec,
  type DeltaSnapshotKey,
  type S3Kind,
  fieldS3URL,
  partitionPeriod,
} from '../shared/codecs/deltacodec.ts'
import {MapCodec} from '../shared/codecs/mapcodec.ts'
import {makePartitionKey} from '../shared/partition.ts'
import {
  type Box,
  type PartitionKey,
  type XY,
  boxHits,
} from '../shared/types/2d.ts'
import {getDefaultAppConfig} from '../shared/types/app-config.ts'
import type {FieldConfig} from '../shared/types/field-config.ts'
import type {Cell, Delta} from '../shared/types/field.ts'
import type {PartitionUpdate} from '../shared/types/message.ts'
import {type T5, noT5} from '../shared/types/tid.ts'
import type {Cam} from './renderer/cam.ts'

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
  /**
   * The latest sequence being fetched. Only one in-flight request allowed.
   * noSeq on un/successful completion. Use pending and written to determine
   * when to fetch.
   */
  pending: number
  /**
   * The latest available sequence known for the partition. This is written by
   * messages received and has nothing to do with fetch state. Use to identify
   * fetch target and dropped messages.
   */
  seq: number
  /**
   * The latest sequence written to a partition (could be patch or replace). Use
   * pending and written to determine when to fetch.
   */
  written: number
  readonly xy: Readonly<XY>
}

const noSeq: number = -1

/**
 * Accepts new realtime messages and initiates partition patch and replace
 * fetches as appropriate for the current viewport.
 *
 * to-do: full no-realtime support; needs aforementioned miss support +
 *        leaderboard + sequence sync.
 */
export class FieldFetcher {
  #abortCtrl: AbortController = new AbortController()
  readonly #cam: Readonly<Cam>
  /** Camera partitions rectangle. */
  #camPartBox: Readonly<Box> | undefined
  #challenge: number = 0
  #maxDroppedPatches: number = getDefaultAppConfig().globalMaxDroppedPatches
  #maxPending: number = getDefaultAppConfig().globalMaxParallelS3Fetches
  #pathPrefix: string = ''
  #config: Readonly<FieldConfig> | undefined // Implicitly used to test init.
  #part: {[key: PartitionKey]: Part} = {}
  /** Number of inflight requests. */
  #pending: number = 0
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
    this.#part = {}
  }

  /** Called on initial render and reinit to initialize the entire field. */
  init(
    config: Readonly<FieldConfig>,
    maxDroppedPatches: number,
    maxPending: number,
    t5: T5,
    key: Readonly<DeltaSnapshotKey> | undefined,
  ): void {
    this.#abortCtrl = new AbortController()
    this.#config = config
    this.#maxDroppedPatches = maxDroppedPatches
    this.#maxPending = maxPending
    this.#t5 = t5

    if (!key) return
    const part = this.#recordMessage(key)
    void this.#fetchPart(part) // Assume visible.
  }

  /** Called when a new partition is available for download by realtime. */
  message(update: Readonly<PartitionUpdate>): void {
    const part = this.#recordMessage(update.key)

    // Not initialized yet for challenge.
    if (!this.#config || update.key.challengeNumber !== this.#challenge) return

    if (
      (update.key.kind === 'partition' || update.key.noChange) &&
      part.written !== noSeq
    )
      return // Nothing new.
    if (this.#isPartFetchable(part)) void this.#fetchPart(part) // to-do: await on separate thread.
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
    if (part.dropped > this.#maxDroppedPatches || part.written === noSeq) {
      if (partitionOffset < this.#maxDroppedPatches || part.written === noSeq)
        kind = 'partition'
      else console.info('min dropped >= max dropped')
    }

    const key = {
      challengeNumber: this.#challenge,
      kind,
      noChange: true, // to-do: fix type.
      partitionXY: part.xy,
      pathPrefix: this.#pathPrefix,
      sequenceNumber: part.seq - (kind === 'deltas' ? 0 : partitionOffset),
      subredditId: this.#t5,
    }

    const prevDropped = part.dropped
    part.pending = key.sequenceNumber
    this.#pending++

    let rsp
    try {
      rsp = await fetchPart(key, this.#abortCtrl)
    } catch (err) {
      if (!this.#abortCtrl.signal.aborted) console.warn(err)
      return
    } finally {
      part.pending = noSeq
      this.#pending--
    }

    if (kind === 'partition') part.dropped -= prevDropped // Reset on replace.
    part.written = key.sequenceNumber

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
      this.#pending < this.#maxPending && // Not maxed out.
      part.pending === noSeq && // Not pending.
      part.written < part.seq && // New data available.
      this.#isPartVisible(part) // Not hidden.
    )
  }

  #isPartVisible(part: Readonly<Part>): boolean {
    if (!this.#camPartBox) return false
    return boxHits(this.#camPartBox, part.xy)
  }

  #recordMessage(key: Readonly<DeltaSnapshotKey>): Part {
    this.#challenge = Math.max(this.#challenge, key.challengeNumber)
    this.#pathPrefix = key.pathPrefix

    const partKey = makePartitionKey(key.partitionXY)
    const part = (this.#part[partKey] ??= Part(key.partitionXY))

    // Replace messages are expected to duplicate patch messages and do not
    // correctly post noChange. This would cause a double count if both are
    // received. This conditional is not quite correct since it's possible to
    // only receive a replace but deduplicating reliably would be hard.
    if (key.kind === 'deltas')
      // Record dropped before fetching. Realtime updates always come in order
      // but responses do not. noSeq is -1. Patch and replace messages can come
      // in any order which means part.seq may or may not be equal to
      // key.sequenceNumber.
      part.dropped +=
        key.sequenceNumber -
        Math.min(key.sequenceNumber, part.seq + (key.noChange ? 1 : 0))
    part.seq = Math.max(part.seq, key.sequenceNumber)

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
  return {x: start.x, y: start.x, w: end.x - start.x, h: end.y - start.y}
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
  if (!rsp.ok)
    throw Error(`part fetch error ${rsp.status}: ${rsp.statusText} for ${url}`)
  const type = rsp.headers.get('Content-Type')
  if (!type?.startsWith('application/binary'))
    throw Error(`bad part fetch response type ${type} for ${url}`)
  return await rsp.arrayBuffer()
}

function Part(xy: Readonly<XY>): Part {
  return {dropped: 0, pending: noSeq, seq: noSeq, written: noSeq, xy}
}
