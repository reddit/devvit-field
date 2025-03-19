import {describe, expect, test} from 'vitest'
import {getDefaultAppConfig} from '../../shared/types/app-config.js'
import type {UTCMillis} from '../../shared/types/time.js'
import {PartData, _calcNextSeqInputs, _testNextSeq} from './part-data.js'
import {Seq, noSeq} from './seq.js'

test('PartData._isVisible()', () => {
  expect(
    new PartData({x: 15, y: 15, w: 5, h: 5}, getDefaultAppConfig(), 5, {
      x: 0,
      y: 0,
    })._isVisible(),
  ).toBe(false)
  expect(
    new PartData({x: 15, y: 15, w: 5, h: 5}, getDefaultAppConfig(), 5, {
      x: 1,
      y: 2,
    })._isVisible(),
  ).toBe(false)
  expect(
    new PartData({x: 15, y: 15, w: 5, h: 5}, getDefaultAppConfig(), 5, {
      x: 3,
      y: 3,
    })._isVisible(),
  ).toBe(true)
})

test('PartData._xy()', () => {
  expect(
    new PartData({x: 0, y: 0, w: 0, h: 0}, getDefaultAppConfig(), 5, {
      x: 0,
      y: 0,
    }).xy,
  ).toStrictEqual({x: 0, y: 0})
  expect(
    new PartData({x: 0, y: 0, w: 0, h: 0}, getDefaultAppConfig(), 5, {
      x: 1,
      y: 2,
    }).xy,
  ).toStrictEqual({x: 5, y: 10})
  expect(
    new PartData({x: 0, y: 0, w: 0, h: 0}, getDefaultAppConfig(), 5, {
      x: 3,
      y: 3,
    }).xy,
  ).toStrictEqual({x: 15, y: 15})
})

describe('_calcNextSeqInputs()', () => {
  test('no avail or max seq is no seq', () => {
    const avail = {changed: noSeq, updated: 0} as const
    const live = {
      globalPDFGuessAfterMillis: 1000,
      globalPDFGuessOffsetMillis: -1000,
    }
    const maxSeq = noSeq
    const maxSeqUpdated = 0
    const now = 2000 as UTCMillis
    const possible = _calcNextSeqInputs(avail, live, maxSeq, maxSeqUpdated, now)
    expect(possible).toStrictEqual({avail: -1, guess: -1})
  })

  test('avail seq is included', () => {
    const avail = {changed: Seq(1), updated: 1 as UTCMillis} as const
    const live = {
      globalPDFGuessAfterMillis: 1000,
      globalPDFGuessOffsetMillis: -1000,
    }
    const maxSeq = noSeq
    const maxSeqUpdated = 0
    const now = 2000 as UTCMillis
    const possible = _calcNextSeqInputs(avail, live, maxSeq, maxSeqUpdated, now)
    expect(possible).toStrictEqual({avail: avail.changed, guess: -1})
  })

  test('max seq is omitted before time', () => {
    const avail = {changed: Seq(1), updated: 1 as UTCMillis} as const
    const live = {
      globalPDFGuessAfterMillis: 1000,
      globalPDFGuessOffsetMillis: -1000,
    }
    const maxSeq = Seq(2)
    const maxSeqUpdated = 1 as UTCMillis
    const now = 500 as UTCMillis
    const possible = _calcNextSeqInputs(avail, live, maxSeq, maxSeqUpdated, now)
    expect(possible).toStrictEqual({avail: avail.changed, guess: -1})
  })

  test('max seq is included after time', () => {
    const avail = {changed: Seq(1), updated: 1 as UTCMillis} as const
    const live = {
      globalPDFGuessAfterMillis: 1000,
      globalPDFGuessOffsetMillis: -1000,
    }
    const maxSeq = Seq(2)
    const maxSeqUpdated = 1 as UTCMillis
    const now = 2000 as UTCMillis
    const possible = _calcNextSeqInputs(avail, live, maxSeq, maxSeqUpdated, now)
    expect(possible).toStrictEqual({avail: avail.changed, guess: maxSeq})
  })

  test('guess is omitted if offset is negative', () => {
    const avail = {changed: Seq(1), updated: 1 as UTCMillis} as const
    const live = {
      globalPDFGuessAfterMillis: 1000,
      globalPDFGuessOffsetMillis: -1000,
    }
    const maxSeq = Seq(2)
    const maxSeqUpdated = 1 as UTCMillis
    const now = 2000 as UTCMillis
    const possible = _calcNextSeqInputs(avail, live, maxSeq, maxSeqUpdated, now)
    expect(possible).toStrictEqual({avail: avail.changed, guess: maxSeq})
  })

  test('guess is included after time', () => {
    const avail = {changed: Seq(1), updated: 1 as UTCMillis} as const
    const live = {
      globalPDFGuessAfterMillis: 1000,
      globalPDFGuessOffsetMillis: -1000,
    }
    const maxSeq = Seq(2)
    const maxSeqUpdated = 1 as UTCMillis
    const now = 2001 as UTCMillis
    const possible = _calcNextSeqInputs(avail, live, maxSeq, maxSeqUpdated, now)
    expect(possible).toStrictEqual({avail: avail.changed, guess: 3})
  })
})

describe('_testNextSeq()', () => {
  test('no seq in, no seq out', () => {
    const droppedPatches = 0
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 0,
      globalPDFMaxPatchesWithoutReplace: 0,
    }
    const seq = noSeq
    const written = {patch: noSeq, replace: noSeq}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toBe(undefined)
  })

  test('never replaced requires replace', () => {
    const droppedPatches = 0
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 1000,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(100)
    const written = {patch: Seq(100), replace: noSeq}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'partition', seq: 100})
  })

  test('seq can be zero', () => {
    const droppedPatches = 0
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 0,
      globalPDFMaxPatchesWithoutReplace: 0,
    }
    const seq = Seq(0)
    const written = {patch: noSeq, replace: noSeq}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'deltas', seq: 0})
  })

  test('replaced and never dropped allows patch', () => {
    const droppedPatches = 0
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 1000,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(101)
    const written = {patch: noSeq, replace: Seq(90)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'deltas', seq: 101})
  })

  test('replaced and never dropped allows patch unless max seqs exceeded', () => {
    const droppedPatches = 0
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxPatchesWithoutReplace: 10,
      globalPDFMaxDroppedPatches: 1000,
    }
    const seq = Seq(101)
    const written = {patch: noSeq, replace: Seq(90)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'partition', seq: 100})
  })

  test('up to max dropped patches allows patch', () => {
    const droppedPatches = 10
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 10,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(100)
    const written = {patch: noSeq, replace: Seq(90)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'deltas', seq: 100})
  })

  test('too many dropped patches requires replace', () => {
    const droppedPatches = 11
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 10,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(100)
    const written = {patch: noSeq, replace: Seq(90)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'partition', seq: 100})
  })

  test('too many dropped patches requires replace unless that would also require replace', () => {
    const droppedPatches = 11
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 10,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(101)
    const written = {patch: noSeq, replace: Seq(90)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'deltas', seq: 101})
  })

  test('replaces are modulo period', () => {
    const droppedPatches = 12
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 10,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(101)
    const written = {patch: noSeq, replace: Seq(90)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toStrictEqual({kind: 'partition', seq: 100})
  })

  test('replace seq must be greater than replaced', () => {
    const droppedPatches = 11
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 10,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(100)
    const written = {patch: noSeq, replace: Seq(100)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toBe(undefined)
  })

  test('patch seq must be greater than patched', () => {
    const droppedPatches = 0
    const fetched: Seq[] = []
    const live = {
      globalPDFMaxDroppedPatches: 1000,
      globalPDFMaxPatchesWithoutReplace: 1000,
    }
    const seq = Seq(100)
    const written = {patch: Seq(100), replace: Seq(90)}
    const next = _testNextSeq(droppedPatches, fetched, live, seq, written)
    expect(next).toBe(undefined)
  })
})
