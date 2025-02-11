import {decodeVTT, encodeVTT} from '../../../shared/bitfieldHelpers'
import {getTeamFromUserId} from '../../../shared/team'
import type {XY} from '../../../shared/types/2d'
import type {T2} from '../../../shared/types/tid'
import type {BitfieldCommand, NewDevvitContext} from './_utils/NewDevvitContext'
import {challengeConfigGet} from './challenge'
import type {Delta} from './deltas'
import {deltasAdd} from './deltas'

const createFieldKey = (challengeNumber: number) =>
  `challenge:${challengeNumber}:field` as const

export const FIELD_CELL_BITS = 3

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
  userId,
  challengeNumber,
  redis,
}: {
  coords: XY[]
  userId: T2
  challengeNumber: number
  redis: NewDevvitContext['redis']
}): Promise<{deltas: Delta[]}> => {
  if (coords.length === 0) return {deltas: []}

  // TODO: Make sure to arrange the coords by their offset
  // because redis.bitfield returns the results in the order of the offsets
  // so we can match them up with the coords

  const fieldKey = createFieldKey(challengeNumber)
  const fieldMeta = await challengeConfigGet({redis, challengeNumber})

  // Produce and operation for each coord that we want to claim. The return value
  // will be used to see if we successfully claimed the cell.
  const claimOps: BitfieldCommand[] = coords.map(
    (coord): BitfieldCommand => [
      'set',
      `u${FIELD_CELL_BITS}`,
      coordsToOffset(
        enforceBounds({coord, cols: fieldMeta.size, rows: fieldMeta.size}),
        fieldMeta.size,
      ),
      encodeVTT(1, 0), // we assume team 0 here since there isn't an extra bit to define an unknown team!
    ],
  )

  // @ts-expect-error - not sure
  const claimOpsReturn = await redis.bitfield(fieldKey, ...claimOps.flat())

  if (claimOpsReturn.length !== coords.length) {
    throw new Error(
      'Claim ops return length does not match coords length. We expect a 1:1 mapping in length and order. This means our understanding of the API is incorrect.',
    )
  }

  const teamNumber = getTeamFromUserId(userId)
  const teamWriteOps: BitfieldCommand[] = []
  // The index of the coord in the original coords array
  // Used to look up XY after the bitfield operation
  const teamWriteOpsCoordIndex: number[] = []

  // Iterate over the results of the claims operations to filter out the ones that
  // were successfully claimed and create the write operations for the team.
  claimOpsReturn.forEach((value, i) => {
    const coordForIndex = coords[i]
    const {claimed} = decodeVTT(value)

    if (claimed === 0 && coordForIndex) {
      teamWriteOpsCoordIndex.push(i)
      teamWriteOps.push([
        'set',
        `u${FIELD_CELL_BITS}`,
        coordsToOffset(
          enforceBounds({
            coord: coordForIndex,
            cols: fieldMeta.size,
            rows: fieldMeta.size,
          }),
          fieldMeta.size,
        ),
        encodeVTT(1, teamNumber),
      ])
    }
  })

  // @ts-expect-error - not sure
  const teamOpsReturn = await redis.bitfield(fieldKey, ...teamWriteOps.flat())

  // Produce the deltas from the write operation to be stored somewhere
  const deltas: Delta[] = []
  teamOpsReturn.forEach((value, i) => {
    const coordForIndex = coords[teamWriteOpsCoordIndex[i]!]
    const {team} = decodeVTT(value)

    if (coordForIndex) {
      deltas.push({coord: coordForIndex, team})
    }
  })

  // TODO: See if any values are mines and if so, end the game for the player
  // immediately with a realtime events

  // TODO: Check to see if the game is over
  // TODO: Fire a job to for ascension if the game is over and other post processing like flairs

  // TODO: Increment scores, etc.
  // const txn = await redis.watch()
  // await txn.multi()
  // await txn.
  // // For the ones that are 0
  // // 1. Write again with the team values
  // // 2. increment the team's score (if not a mine?)
  // // increment the user's score (if not a mine?)
  // await txn.exec()

  await deltasAdd({
    redis,
    challengeNumber,
    deltas,
  })

  // Since we're using transactions we need this extra read to get the updated score values

  return {
    deltas,
  }
}

/**
 * Gets the bitfield for a given challenge in order.
 *
 * NOTE: This is only for testing right now until we find a more efficient
 * way to return all items in a bitfield. At a minimum, we need to the
 * partition a required command so we don't risk sending 10 million bits at once.
 *
 * TODO: I tried to use redis.get, but the problem is that Redis orders the bits
 * differently and I couldn't figure out how to rearrange them. It would also be nice
 * to use redis.getBuffer if it can be added.
 */
export const fieldGet = async ({
  challengeNumber,
  redis,
}: {
  challengeNumber: number
  redis: NewDevvitContext['redis']
}): Promise<number[]> => {
  const meta = await challengeConfigGet({redis, challengeNumber})

  const area = meta.size * meta.size

  if (area > 5_000) {
    throw new Error(
      `Challenge size too large! This is only for testing right now until we find a more efficient way to return all items in a bitfield. At a minimum, we need to the partition a required command so we don't risk sending 10 million bits at once.`,
    )
  }

  const data = await redis.get(createFieldKey(challengeNumber))
  if (data === undefined) {
    throw new Error('No field data found')
  }

  const commands: BitfieldCommand[] = []

  for (let i = 0; i < meta.size * meta.size; i++) {
    commands.push(['get', 'u3', i * FIELD_CELL_BITS])
  }

  // TODO: Is there a limit here? Should we chunk?
  const result = await redis.bitfield(
    createFieldKey(challengeNumber),
    // @ts-expect-error - not sure
    ...commands.flat(),
  )

  return result
}
