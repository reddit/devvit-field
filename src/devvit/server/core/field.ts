import type {BitfieldCommand, Devvit} from '@devvit/public-api'
import {decodeVTT, encodeVTT} from '../../../shared/bitfieldHelpers'
import {GLOBAL_REALTIME_CHANNEL} from '../../../shared/const'
import {
  getPartitionAndLocalCoords,
  makePartitionKey,
} from '../../../shared/partition'
import {getTeamFromUserId} from '../../../shared/team'
import type {XY} from '../../../shared/types/2d'
import type {Delta} from '../../../shared/types/field'
import type {ChallengeCompleteMessage} from '../../../shared/types/message'
import type {T2} from '../../../shared/types/tid'
import {type ChallengeConfig, challengeConfigGet} from './challenge'
import {deltasAdd} from './deltas'
import {
  playerStatsCellsClaimedGameOver,
  playerStatsCellsClaimedIncrementForMember,
} from './leaderboards/challenge/player.cellsClaimed'
import {
  teamStatsCellsClaimedGet,
  teamStatsCellsClaimedIncrementForMember,
} from './leaderboards/challenge/team.cellsClaimed'
import {teamStatsMinesHitIncrementForMember} from './leaderboards/challenge/team.minesHit'
import {minefieldIsMine} from './minefield'
import {computeScore} from './score'

const createFieldPartitionKey = (challengeNumber: number, partitionXY: XY) =>
  `challenge:${challengeNumber}:field:${makePartitionKey(partitionXY)}` as const

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
  if (!Number.isInteger(coord.x) || !Number.isInteger(coord.y)) {
    throw new Error(`Non-integer: ${coord.x}, ${coord.y}`)
  }

  if (coord.x < 0 || coord.x >= cols || coord.y < 0 || coord.y >= rows) {
    throw new Error(`Out of bounds: ${coord.x}, ${coord.y}`)
  }

  return coord
}

type BatchItem = Omit<Delta, 'team'> & {
  partitionXY: XY
  localXY: XY
}

/**
 * Runs through a batch of coords and breaks AFTER the first mine is hit. This
 * is used to ensure cell claims and scoring since the client doesn't know where
 * mines are.
 */
const produceValidBatch = ({
  coords,
  challengeConfig,
}: {coords: XY[]; challengeConfig: ChallengeConfig}) => {
  const validCoords: BatchItem[] = []

  for (const coord of coords) {
    // This is the bounds for the board
    // We also enforce bounds for the partition at the bitfield write sites
    enforceBounds({
      coord,
      cols: challengeConfig.size,
      rows: challengeConfig.size,
    })

    const isBan = minefieldIsMine({
      seed: challengeConfig.seed,
      coord,
      cols: challengeConfig.size,
      config: {mineDensity: challengeConfig.mineDensity},
    })

    validCoords.push({
      globalXY: coord,
      isBan,
      ...getPartitionAndLocalCoords(coord, challengeConfig.partitionSize),
    })

    // Once the user hits a mine, the game is over for them so we
    // drop the rest of the batch on the floor.
    if (isBan) {
      break
    }
  }

  return validCoords
}

/**
 * @internal
 *
 * Ran after claiming cells to do post processing. Broken out for testing only.
 */
export const _fieldClaimCellsSuccess = async ({
  challengeNumber,
  userId,
  deltas,
  ctx,
  fieldConfig,
}: {
  challengeNumber: number
  userId: T2
  deltas: Delta[]
  ctx: Devvit.Context
  fieldConfig: ChallengeConfig
}): Promise<void> => {
  // TODO: Everything in a transaction?

  // Save deltas first since we have a job running consuming them and
  // stuff below could take a little bit of time
  await deltasAdd({
    redis: ctx.redis,
    challengeNumber,
    deltas,
  })

  const isGameOverForUser = deltas.some(delta => delta.isBan)

  // User stats
  if (isGameOverForUser) {
    await playerStatsCellsClaimedGameOver({
      challengeNumber,
      member: userId,
      redis: ctx.redis,
    })
  } else {
    await playerStatsCellsClaimedIncrementForMember({
      challengeNumber,
      member: userId,
      redis: ctx.redis,
      // Since it's not game over, user gets all the deltas produced
      incrementBy: deltas.length,
    })
  }

  const teamNumber = getTeamFromUserId(userId)
  // Team stats
  await teamStatsMinesHitIncrementForMember({
    challengeNumber,
    member: teamNumber,
    redis: ctx.redis,
    incrementBy: isGameOverForUser ? 1 : 0,
  })
  await teamStatsCellsClaimedIncrementForMember({
    challengeNumber,
    member: teamNumber,
    redis: ctx.redis,
    // Mines count as claims since the scoring algorithm counts all squares
    incrementBy: deltas.length,
  })

  const standings = await teamStatsCellsClaimedGet({
    challengeNumber,
    redis: ctx.redis,
  })

  const {isOver} = computeScore({
    size: fieldConfig.size,
    teams: standings,
  })

  if (isOver) {
    const msg: ChallengeCompleteMessage = {
      challengeNumber,
      standings,
      type: 'ChallengeComplete',
    }
    // TODO: Increment user stats here or do it somewhere else?
    await ctx.realtime.send(GLOBAL_REALTIME_CHANNEL, msg)

    await ctx.scheduler.runJob({
      runAt: new Date(),
      name: 'ON_CHALLENGE_END',
      data: {challengeNumber},
    })

    // TODO: Fire a job to for ascension if the game is over and other post processing like flairs

    // TODO: When the game is over, start a new game? Maybe that needs to be a countdown and timer to the user's screens?
  }
}

/**
 * @internal
 *
 * The actual bitfield operations ran for a partition. Broken out for testing only.
 */
const _fieldClaimCellsBitfieldOpsForPartition = async ({
  batch,
  fieldConfig,
  ctx,
  userId,
  fieldPartitionKey,
}: {
  batch: BatchItem[]
  fieldConfig: ChallengeConfig
  ctx: Devvit.Context
  userId: T2
  fieldPartitionKey: ReturnType<typeof createFieldPartitionKey>
}): Promise<Delta[]> => {
  // Produce and operation for each coord that we want to claim. The return value
  // will be used to see if we successfully claimed the cell.
  const claimOps: BitfieldCommand[] = batch.map(
    ({localXY}): BitfieldCommand => [
      'set',
      `u${FIELD_CELL_BITS}`,
      coordsToOffset(
        enforceBounds({
          coord: localXY,
          cols: fieldConfig.partitionSize,
          rows: fieldConfig.partitionSize,
        }),
        fieldConfig.partitionSize,
      ),
      encodeVTT(1, 0), // we assume team 0 here since there isn't an extra bit to define an unknown team!
    ],
  )

  const claimOpsReturn = await ctx.redis.bitfield(
    fieldPartitionKey,
    // @ts-expect-error - not sure
    ...claimOps.flat(),
  )

  if (claimOpsReturn.length !== batch.length) {
    throw new Error(
      'Claim ops return length does not match batch length. We expect a 1:1 mapping in length and order. This means our understanding of the API is incorrect.',
    )
  }

  const teamNumber = getTeamFromUserId(userId)
  const teamWriteOps: BitfieldCommand[] = []
  // The index of the coord in the original coords array
  // Used to look up XY after the bitfield operation
  const teamWriteOpsBatchIndex: number[] = []

  // Iterate over the results of the claims operations to filter out the ones that
  // were successfully claimed and create the write operations for the team.
  claimOpsReturn.forEach((value, i) => {
    const batchItem = batch[i]
    const {claimed} = decodeVTT(value)

    if (claimed === 0 && batchItem) {
      teamWriteOpsBatchIndex.push(i)
      teamWriteOps.push([
        'set',
        `u${FIELD_CELL_BITS}`,
        coordsToOffset(
          enforceBounds({
            coord: batchItem.localXY,
            cols: fieldConfig.partitionSize,
            rows: fieldConfig.partitionSize,
          }),
          fieldConfig.partitionSize,
        ),
        encodeVTT(1, teamNumber),
      ])
    }
  })

  const teamOpsReturn = await ctx.redis.bitfield(
    fieldPartitionKey,
    // @ts-expect-error - not sure
    ...teamWriteOps.flat(),
  )

  // Produce the deltas from the write operation to be stored somewhere
  const deltas: Delta[] = []
  teamOpsReturn.forEach((value, i) => {
    const batchItem = batch[teamWriteOpsBatchIndex[i]!]
    const {team} = decodeVTT(value)

    if (batchItem) {
      deltas.push({
        globalXY: batchItem.globalXY,
        isBan: batchItem.isBan,
        team,
      })
    }
  })

  return deltas
}

export const fieldClaimCells = async ({
  coords,
  userId,
  challengeNumber,
  ctx,
}: {
  /**
   * NOTE: This has to be in the order that the user clicked from the client since we don't
   * know if there are mines or not in what they clicked. We use this order to chop off the
   * batch at the first hit mine.
   *
   * THESE ARE GLOBAL coords!
   *
   * Example:
   * [0,1] not mine
   * [0,2] mine
   * [0,3] not mine
   *
   * Only [0,1] and [0,2] will be attempted to be claimed for the user and team. The user
   * will get game over. The team will get one point for [0,1].
   */
  coords: XY[]
  userId: T2
  challengeNumber: number
  ctx: Devvit.Context
}): Promise<{deltas: Delta[]}> => {
  if (coords.length === 0) return {deltas: []}

  // We need a lookup here instead of passing in the config from blocks land
  // because blocks doesn't have the seed and other backend only pieces
  // of information that we need
  const fieldConfig = await challengeConfigGet({
    redis: ctx.redis,
    challengeNumber,
  })

  const batch = produceValidBatch({coords, challengeConfig: fieldConfig})

  // First, get the
  const partitionBatchMap: Record<
    ReturnType<typeof createFieldPartitionKey>,
    typeof batch
  > = {}

  for (const batchItem of batch) {
    const fieldPartitionKey = createFieldPartitionKey(
      challengeNumber,
      batchItem.partitionXY,
    )

    if (!partitionBatchMap[fieldPartitionKey]) {
      partitionBatchMap[fieldPartitionKey] = []
    }

    partitionBatchMap[fieldPartitionKey].push(batchItem)
  }

  const fieldsOpsReturn = await Promise.all(
    Object.entries(partitionBatchMap).map(([fieldPartitionKey, batch]) =>
      _fieldClaimCellsBitfieldOpsForPartition({
        batch,
        fieldPartitionKey: fieldPartitionKey as ReturnType<
          typeof createFieldPartitionKey
        >,
        ctx,
        fieldConfig,
        userId,
      }),
    ),
  )

  const deltas = fieldsOpsReturn.flat()

  await _fieldClaimCellsSuccess({
    challengeNumber,
    userId,
    deltas,
    ctx,
    fieldConfig,
  })

  // TODO: Where I return to client anything you need like user's scores and other things
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
  partitionXY,
}: {
  challengeNumber: number
  redis: Devvit.Context['redis']
  partitionXY: XY
}): Promise<number[]> => {
  const meta = await challengeConfigGet({redis, challengeNumber})

  const area = meta.size * meta.size

  if (area > 5_000) {
    throw new Error(
      `Challenge size too large! This is only for testing right now until we find a more efficient way to return all items in a bitfield. At a minimum, we need to the partition a required command so we don't risk sending 10 million bits at once.`,
    )
  }

  const data = await redis.get(
    createFieldPartitionKey(challengeNumber, partitionXY),
  )
  if (data === undefined) {
    throw new Error('No field data found')
  }

  const commands: BitfieldCommand[] = []

  for (let i = 0; i < meta.size * meta.size; i++) {
    commands.push(['get', 'u3', i * FIELD_CELL_BITS])
  }

  // TODO: Is there a limit here? Should we chunk?
  const result = await redis.bitfield(
    createFieldPartitionKey(challengeNumber, partitionXY),
    // @ts-expect-error - not sure
    ...commands.flat(),
  )

  return result
}
