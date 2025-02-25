import type {BitfieldCommand, Devvit} from '@devvit/public-api'
import {GLOBAL_REALTIME_CHANNEL} from '../../../shared/const'
import {
  getGlobalCoords,
  getPartitionAndLocalCoords,
  makePartitionKey,
} from '../../../shared/partition'
import type {Profile} from '../../../shared/save'
import {type Team, getTeamFromUserId} from '../../../shared/team'
import type {XY} from '../../../shared/types/2d'
import type {ChallengeConfig} from '../../../shared/types/challenge-config'
import type {Delta} from '../../../shared/types/field'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../../shared/types/message'
import type {T2} from '../../../shared/types/tid'
import {decodeVTT, encodeVTT} from './bitfieldHelpers'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
  challengeMakeNew,
} from './challenge'
import {deltasAdd} from './deltas'
import {
  teamStatsCellsClaimedGet,
  teamStatsCellsClaimedIncrementForMember,
} from './leaderboards/challenge/team.cellsClaimed'
import {
  teamStatsByPlayerCellsClaimedForMember,
  teamStatsByPlayerCellsClaimedGameOver,
  teamStatsByPlayerCellsClaimedIncrementForMember,
} from './leaderboards/challenge/team.cellsClaimedByPlayer'
import {teamStatsMinesHitIncrementForMember} from './leaderboards/challenge/team.minesHit'
import {levels, makeLevelRedirect} from './levels'
import {minefieldIsMine} from './minefield'
import {computeScore} from './score'
import {
  userAscendLevel,
  userDescendLevel,
  userSetLastPlayedChallenge,
} from './user'

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

export const fieldEndGame = async (
  ctx: Devvit.Context,
  challengeNumber: number,
  standings: {
    member: Team
    score: number
  }[],
  p1BoxCount: number,
): Promise<void> => {
  const msg: ChallengeCompleteMessage = {
    challengeNumber,
    standings,
    type: 'ChallengeComplete',
    p1BoxCount,
  }
  // TODO: Increment user stats here or do it somewhere else?
  await ctx.realtime.send(GLOBAL_REALTIME_CHANNEL, msg)

  // TODO: When the game is over, start a new game? Maybe that needs to be a countdown and timer to the user's screens?
  // Make a new game immediately, because yolo
  await challengeMakeNew({
    ctx,
  })
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
    console.log(`Game over for ${userId}. Hit a mine!`)
    await teamStatsByPlayerCellsClaimedGameOver({
      challengeNumber,
      member: userId,
      redis: ctx.redis,
    })

    await userDescendLevel({
      redis: ctx.redis,
      userId,
    })
  } else {
    await teamStatsByPlayerCellsClaimedIncrementForMember({
      challengeNumber,
      member: userId,
      redis: ctx.redis,
      // Since it's not game over, user gets all the deltas produced
      incrementBy: deltas.length,
    })

    await userSetLastPlayedChallenge({
      challengeNumber,
      redis: ctx.redis,
      userId,
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
    const p1BoxCount = 0 // to-do: fill me out.
    await fieldEndGame(ctx, challengeNumber, standings, p1BoxCount)
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
  teamOpsReturn.forEach((_value, i) => {
    const batchItem = batch[teamWriteOpsBatchIndex[i]!]

    if (batchItem) {
      deltas.push({
        globalXY: batchItem.globalXY,
        isBan: batchItem.isBan,
        team: teamNumber,
      })
    }
  })

  return deltas
}

/**
 * Make sure the user has access to:
 * 1. View the field
 * 2. Claims cells for the field
 *
 * pass: true means the user can claim cells
 * pass: false means the user cannot claim cells
 *
 * On false, you'll be provided a message and a redirectURL
 * to send the user to.
 */
type CanUserClaimCellsResponse =
  | {
      pass: true
    }
  | ({
      pass: false
      redirectURL: string
    } & Omit<DialogMessage, 'type'>)

export const fieldValidateUserAndAttemptAscend = async ({
  profile,
  challengeNumber,
  ctx,
}: {
  profile: Profile
  challengeNumber: number
  ctx: Devvit.Context
}): Promise<CanUserClaimCellsResponse> => {
  // User has never played before
  if (
    profile.lastPlayedChallengeNumberForLevel === 0 &&
    profile.currentLevel === 0
  ) {
    return {pass: true}
  }

  const level = levels.find(x => x.subredditId === ctx.subredditId)
  if (!level) {
    throw new Error(`No level config found for subreddit ${ctx.subredditId}`)
  }

  if (profile.currentLevel !== level.id) {
    return {
      pass: false,
      message: `You are not on the correct level. You should be at level ${profile.currentLevel}, not ${level.id}.`,
      redirectURL: makeLevelRedirect(profile.currentLevel),
      code: 'WrongLevel',
    }
  }

  const currentChallengeNumber = await challengeGetCurrentChallengeNumber({
    redis: ctx.redis,
  })

  if (profile.lastPlayedChallengeNumberForLevel === currentChallengeNumber) {
    return {pass: true}
  }

  const standings = await teamStatsCellsClaimedGet({
    challengeNumber,
    redis: ctx.redis,
  })

  const winningTeam = standings[0]!.member
  const userTeam = getTeamFromUserId(profile.t2)

  if (winningTeam === userTeam) {
    const cellsClaimed = await teamStatsByPlayerCellsClaimedForMember({
      challengeNumber,
      member: profile.t2,
      redis: ctx.redis,
    })
    if (cellsClaimed && cellsClaimed > 0) {
      const newLevel = await userAscendLevel({
        redis: ctx.redis,
        userId: profile.t2,
      })

      return {
        pass: false,
        message: `You were on the winning team and claimed more than one cell. You have ascended to level ${newLevel}.`,
        code: 'WrongLevel',
        redirectURL: makeLevelRedirect(newLevel),
      }
    }
  }

  return {pass: true}
}

/**
 * NOTE: Call fieldValidateUserAndAttemptAscend before this function to ensure
 * the user can claim cells! Separated to make it easier for the client to
 * handle the failure cases.
 */
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
 * TODO: Replace this with redis.getBuffer when it's available.
 *
 * @returns Array of numbers (you need to decode with decodeVTT). If the partition
 * does not yet exist in redis, returns empty array!
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

  const data = await redis.strLen(
    createFieldPartitionKey(challengeNumber, partitionXY),
  )
  if (data === 0) return []

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

export const fieldGetDeltas = async ({
  challengeNumber,
  redis,
  partitionXY,
}: {
  challengeNumber: number
  redis: Devvit.Context['redis']
  partitionXY: XY
}): Promise<Delta[]> => {
  const meta = await challengeConfigGet({redis, challengeNumber})
  const fieldData = await fieldGet({challengeNumber, redis, partitionXY})

  if (fieldData.length === 0) return []

  const deltas: Delta[] = []

  for (let i = 0; i < meta.partitionSize * meta.partitionSize; i++) {
    const {claimed, team} = decodeVTT(fieldData[i]!)

    if (claimed === 0) continue

    const localXY = {
      x: i % meta.partitionSize,
      y: Math.floor(i / meta.partitionSize),
    }
    const globalXY = getGlobalCoords(partitionXY, localXY, meta.partitionSize)

    deltas.push({
      globalXY,
      isBan: minefieldIsMine({
        seed: meta.seed,
        coord: globalXY,
        cols: meta.size,
        config: {mineDensity: meta.mineDensity},
      }),
      team,
    })
  }

  return deltas
}
