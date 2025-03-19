import {
  type DeltaSnapshotKey,
  type S3Kind,
  partitionPeriod,
} from '../../shared/codecs/deltacodec.ts'
import {type Box, type XY, boxHits} from '../../shared/types/2d.ts'
import type {AppConfig} from '../../shared/types/app-config.ts'
import type {UTCMillis} from '../../shared/types/time.ts'
import {type NoSeq, Seq, noSeq} from './seq.ts'

type NextSeqInputs = {avail: Seq | NoSeq; guess: Seq | NoSeq}

export class PartData {
  readonly partXY: Readonly<XY>
  /** Pixel coords. */
  readonly xy: Readonly<XY>

  readonly #avail: {
    changed: Seq | NoSeq
    seq: Seq | NoSeq
    updated: UTCMillis | 0
  } = {
    changed: noSeq,
    seq: noSeq,
    updated: 0,
  }
  readonly #cam: Readonly<Box>
  /**
   * Missed patches since last replace. Reset when replaced. Excludes unchanged
   * sequences.
   */
  #droppedPatches: number = 0
  /** Prior few fetch attempts. */
  readonly #fetched: Seq[] = []
  readonly #live: Readonly<AppConfig>
  readonly #partSize: number
  #pending:
    | {
        readonly droppedPatches: number
        readonly kind: S3Kind
        readonly seq: Seq
      }
    | undefined
  readonly #written: {
    patch: Seq | NoSeq
    patched: UTCMillis | 0
    replace: Seq | NoSeq
    replaced: UTCMillis | 0
  } = {patch: noSeq, patched: 0, replace: noSeq, replaced: 0}

  /**
   * @arg cam Cam ref in pixel coords.
   * @arg live Live config ref.
   * @arg config Config ref.
   */
  constructor(
    cam: Readonly<Box>,
    live: Readonly<AppConfig>,
    partSize: number,
    partXY: Readonly<XY>,
  ) {
    this.#cam = cam
    this.#live = live
    this.#partSize = partSize
    this.partXY = partXY
    this.xy = {
      x: this.partXY.x * this.#partSize,
      y: this.partXY.y * this.#partSize,
    }
  }

  fetch(
    maxSeq: Seq | NoSeq,
    maxSeqUpdated: UTCMillis | 0,
    now: UTCMillis,
  ): {kind: S3Kind; seq: Seq} | undefined {
    if (this.#pending || !this._isVisible()) return

    const inputs = _calcNextSeqInputs(
      this.#avail,
      this.#live,
      maxSeq,
      maxSeqUpdated,
      now,
    )
    const avail = _testNextSeq(
      this.#droppedPatches,
      this.#fetched,
      this.#live,
      inputs.avail,
      this.#written,
    )
    const guess = _testNextSeq(
      this.#droppedPatches,
      this.#fetched,
      this.#live,
      inputs.guess,
      this.#written,
    )

    if (!avail && guess && this.#live.globalPDFDebug) {
      console.debug(
        `[pdf] guess xy=${this.partXY.x}-${this.partXY.y} seq=${guess.seq}${guess.kind === 'deltas' ? 'p' : 'r'} maxSeq=${maxSeq} maxSeqAge=${now - maxSeqUpdated} avail=${this.#avail.seq} changed=${this.#avail.changed}`,
      )
    }

    const seq = avail ?? guess
    if (seq) {
      this.#fetched.unshift(seq.seq)
      while (this.#fetched.length > 3) this.#fetched.pop()
      this.#pending = {
        droppedPatches: Math.max(
          0,
          // Only used for partition calc.
          this.#droppedPatches -
            ((avail ? inputs.avail : inputs.guess) % partitionPeriod),
        ),
        kind: seq.kind,
        seq: seq.seq,
      }
    }
    return seq
  }

  message(key: Readonly<DeltaSnapshotKey>, now: UTCMillis): void {
    // Replace messages are expected to duplicate patch messages but do not
    // correctly post noChange and may be out of sync with patches. Allow any
    // initial message in.
    if (key.kind !== 'deltas' && this.#avail.seq !== noSeq) return

    if (
      (this.#live.globalPDFDebug > 2 && !key.noChange) ||
      this.#live.globalPDFDebug > 3
    )
      console.debug(
        `[pdf] message xy=${key.partitionXY.x}-${key.partitionXY.y} seq=${key.sequenceNumber}${key.kind === 'deltas' ? 'p' : 'r'} changed=${!key.noChange}`,
      )

    const seq = Seq(key.sequenceNumber)

    // Record dropped before fetching. Realtime updates always come in order
    // but responses do not. noSeq is -1.
    if (!key.noChange || this.#avail.changed === noSeq) {
      const dropped =
        seq - Math.min(seq, this.#avail.seq + (key.noChange ? 1 : 0))
      this.#droppedPatches += dropped
      if (dropped && this.#live.globalPDFDebug)
        console.debug(
          `[pdf] xy=${key.partitionXY.x}-${key.partitionXY.y} seq=${key.sequenceNumber}${key.kind === 'deltas' ? 'p' : 'r'} dropped=${this.#droppedPatches}`,
        )
      this.#avail.changed = seq
    }

    this.#avail.seq = seq
    this.#avail.updated = now
  }

  resolve(now: UTCMillis, ok: boolean): void {
    if (!this.#pending) return
    if (ok) {
      this.#droppedPatches = Math.max(
        0,
        this.#droppedPatches -
          (this.#pending.kind === 'deltas' ? 1 : this.#pending.droppedPatches),
      )
      this.#written[this.#pending.kind === 'deltas' ? 'patch' : 'replace'] =
        this.#pending.seq
      this.#written[this.#pending.kind === 'deltas' ? 'patched' : 'replaced'] =
        now
    }
    this.#pending = undefined
  }

  _isVisible(): boolean {
    return boxHits(this.#cam, this.xy)
  }
}

/**
 * Identify the possible next sequence inputs.
 * @internal
 */
export function _calcNextSeqInputs(
  avail: {readonly changed: Seq | NoSeq; readonly updated: UTCMillis | 0},
  live: {
    readonly globalPDFGuessAfterMillis: number
    readonly globalPDFGuessOffsetMillis: number
  },
  maxSeq: Seq | NoSeq,
  maxSeqUpdated: UTCMillis | 0,
  now: UTCMillis,
): NextSeqInputs {
  const possible: NextSeqInputs = {avail: avail.changed, guess: noSeq}

  if (maxSeq === noSeq || !maxSeqUpdated) return possible

  if (now - avail.updated < live.globalPDFGuessAfterMillis) return possible

  const guessOffset = Math.max(
    0,
    Math.trunc((now - maxSeqUpdated + live.globalPDFGuessOffsetMillis) / 1_000),
  )
  possible.guess = Seq(maxSeq + guessOffset)
  return possible
}

/**
 * Given a sequence, return the desired patch or replace.
 * @internal
 */
export function _testNextSeq(
  droppedPatches: number,
  fetched: Seq[],
  live: {
    readonly globalPDFMaxDroppedPatches: number
    readonly globalPDFMaxPatchesWithoutReplace: number
  },
  seq: Seq | NoSeq,
  written: {readonly patch: Seq | NoSeq; readonly replace: Seq | NoSeq},
): {kind: S3Kind; seq: Seq} | undefined {
  if (seq === noSeq) return undefined

  const patch = seq
  const replace = Seq(seq - (seq % partitionPeriod))
  if (written.replace >= patch) return undefined

  let prefer: S3Kind = 'deltas'
  const neverReplaced = written.replace === noSeq
  if (neverReplaced) prefer = 'partition'
  const maxedPatches =
    seq - written.replace > live.globalPDFMaxPatchesWithoutReplace
  if (maxedPatches) prefer = 'partition'
  const maxedDrops =
    droppedPatches - (seq % partitionPeriod) > live.globalPDFMaxDroppedPatches
  if (maxedDrops) prefer = 'partition'

  if (
    prefer === 'partition' &&
    replace !== noSeq &&
    replace > written.replace &&
    !fetched.includes(replace) &&
    // to-do: use 0 instead of -1 for noSeq?
    replace !== 0 // Special case: zero is never available.
  )
    return {kind: prefer, seq: replace}

  if (written.patch >= patch || fetched.includes(patch) || patch === 0)
    return undefined

  return {kind: 'deltas', seq: patch}
}
