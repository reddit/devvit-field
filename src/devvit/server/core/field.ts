import type {XY} from '../../../shared/types/2d'
import type {BitfieldCommand, NewDevvitContext} from './_utils/NewDevvitContext'
import {challengeMetaGet} from './challenge'
import {minefieldIsMine} from './minefield'

const createFieldKey = (challengeNumber: number) =>
  `${challengeNumber}:field` as const

export const FIELD_CELL_BITS = 2

const CELL_STATES = {
  HIDDEN: 0, // 00
  CLAIMED: 1, // 01
  MINE: 2, // 10
}

const coordsToOffset = (coord: XY, cols: number): number => {
  return (coord.y * cols + coord.x) * FIELD_CELL_BITS
}

const enforceBounds = ({
  coord,
  cols,
  rows,
}: {
  coord: XY
  cols: number
  rows: number
}): XY => {
  if (coord.x < 0 || coord.x >= cols || coord.y < 0 || coord.y >= rows) {
    throw new Error(`Out of bounds: ${coord.x}, ${coord.y}`)
  }

  return coord
}

export const fieldClaimCells = async ({
  coords,
  challengeNumber,
  redis,
}: {
  coords: XY[]
  challengeNumber: number
  redis: NewDevvitContext['redis']
}): Promise<{delta: XY[]}> => {
  const fieldKey = createFieldKey(challengeNumber)

  // TODO: We don't need this is we agree it's 100% static and saves us a read per write
  const fieldMeta = await challengeMetaGet({redis, challengeNumber})

  const writeOps: BitfieldCommand[] = coords.map(
    (coord): BitfieldCommand => [
      'set',
      `u${FIELD_CELL_BITS}`,
      coordsToOffset(
        enforceBounds({coord, cols: fieldMeta.cols, rows: fieldMeta.rows}),
        fieldMeta.cols,
      ),
      minefieldIsMine({
        seed: fieldMeta.seed,
        coord,
        cols: fieldMeta.cols,
        config: {mineDensity: fieldMeta.density},
      })
        ? CELL_STATES.MINE
        : CELL_STATES.CLAIMED,
    ],
  )

  // @ts-expect-error - not sure
  const values = await redis.bitfield(fieldKey, ...writeOps.flat())

  const delta: XY[] = []

  for (let i = 0; i < values.length; i++) {
    const coordForIndex = coords[i]
    // Returns previous values so if it was 0, that means
    // it was claimed successfully!
    if (values[i] === 0 && coordForIndex) {
      delta.push(coordForIndex)
    }
  }

  return {
    delta,
  }
}

export const fieldGet = async ({
  challengeNumber,
  redis,
}: {
  challengeNumber: number
  redis: NewDevvitContext['redis']
}): Promise<string> => {
  const data = await redis.get(createFieldKey(challengeNumber))
  if (data === undefined) {
    throw new Error('No field data found')
  }

  return data
}
