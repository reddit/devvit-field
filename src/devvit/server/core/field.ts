import {counter, histogram} from '@devvit/metrics'
import type {BitfieldCommand, Devvit, JobContext} from '@devvit/public-api'
import type {DeltaSnapshotKey} from '../../../shared/codecs/deltacodec.js'
import {MapCodec} from '../../../shared/codecs/mapcodec.js'
import {INSTALL_REALTIME_CHANNEL} from '../../../shared/const'
import {
  getGlobalCoords,
  getPartitionAndLocalCoords,
  getPartitionCoords,
  makePartitionKey,
  parsePartitionXY,
} from '../../../shared/partition'
import {type Team, getTeamFromUserId, teams} from '../../../shared/team'
import type {PartitionKey, XY} from '../../../shared/types/2d'
import type {ChallengeConfig} from '../../../shared/types/challenge-config'
import type {Delta, FieldMap} from '../../../shared/types/field'
import type {Level} from '../../../shared/types/level'
import type {ChallengeCompleteMessage} from '../../../shared/types/message'
import type {T2} from '../../../shared/types/tid'
import {validateFieldArea} from '../../../shared/validateFieldArea.js'
import {decodeVTT, encodeVTT} from './bitfieldHelpers'
import {challengeConfigGet, challengeMakeNew} from './challenge'
import {type Uploader, deltasAdd} from './deltas'
import {
  teamStatsCellsClaimedIncrementForMemberPartitioned,
  teamStatsCellsClaimedIncrementForMemberTotal,
} from './leaderboards/challenge/team.cellsClaimed'
import {teamStatsMinesHitIncrementForMember} from './leaderboards/challenge/team.minesHit'
import {minefieldIsMine} from './minefield'
import {
  userDescendLevel,
  userGet,
  userIncrementLastPlayedChallengeClaimedCells,
  userSetLastPlayedChallenge,
  userSetPlayedIfNotExists,
} from './user'

const metrics = {
  claims: counter({
    name: 'field_cell_claims',
    labels: ['partition', 'success'],
  }),

  claimDurations: histogram({
    name: 'field_cell_claim_duration_seconds_step1',
    labels: [],
    buckets: [
      0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 1.0,
    ],
  }),
}

const createFieldPartitionKey = (challengeNumber: number, partitionXY: XY) =>
  `challenge:${challengeNumber}:field:${makePartitionKey(partitionXY)}` as const

export const createFieldPartitionSnapshotKey = (
  challengeNumber: number,
  partitionXY: XY,
  sequenceNumber: number,
) =>
  `${createFieldPartitionKey(challengeNumber, partitionXY)}:snapshot:${sequenceNumber}`

const createFieldPartitionLatestSnapshotKey = (
  challengeNumber: number,
  partitionXY: XY,
) => `${createFieldPartitionKey(challengeNumber, partitionXY)}:latest`

export const FIELD_CELL_BITS = 3

const coordsToOffset = (coord: XY, cols: number): number => {
  return (coord.y * cols + coord.x) * FIELD_CELL_BITS
}

export const enforceBounds = ({
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

type BatchItemWithTeam = Delta & {
  partitionXY: XY
  localXY: XY
}

type BatchItemWithoutTeam = Omit<BatchItemWithTeam, 'team'>

/**
 * Runs through a batch of coords and breaks AFTER the first mine is hit. This
 * is used to ensure cell claims and scoring since the client doesn't know where
 * mines are.
 */
const produceValidBatch = ({
  coords,
  challengeConfig,
}: {coords: XY[]; challengeConfig: ChallengeConfig}) => {
  const validCoords: BatchItemWithoutTeam[] = []

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
  ctx: Pick<Devvit.Context, 'realtime' | 'redis' | 'subredditName'>,
  challengeNumber: number,
  standings: {
    member: Team
    score: number
  }[],
): Promise<void> => {
  const msg: ChallengeCompleteMessage = {
    challengeNumber,
    standings,
    type: 'ChallengeComplete',
  }
  // TODO: Increment user stats here or do it somewhere else?
  await ctx.realtime.send(INSTALL_REALTIME_CHANNEL, msg)

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
  ctx: JobContext
  fieldConfig: ChallengeConfig
}): Promise<{newLevel: Level | undefined}> => {
  // Deltas need to be applied by partition. Sort them out to start so
  // we can update the correct partitioned accumulators.
  const deltasByPartitionKey = new Map<PartitionKey, Delta[]>()
  for (const delta of deltas) {
    const partitionXY = getPartitionCoords(
      delta.globalXY,
      fieldConfig.partitionSize,
    )
    const partitionKey = makePartitionKey(partitionXY)
    const partitionDeltas = deltasByPartitionKey.get(partitionKey) ?? []
    partitionDeltas.push(delta)
    deltasByPartitionKey.set(partitionKey, partitionDeltas)
  }

  // Save deltas first since we have a job running consuming them and
  // stuff below could take a little bit of time
  // Deltas are added by partition
  const deltasPromises = []
  for (const [partitionKey, partitionDeltas] of deltasByPartitionKey) {
    const partitionXY = parsePartitionXY(partitionKey)
    deltasPromises.push(
      deltasAdd(ctx.redis, challengeNumber, partitionXY, partitionDeltas),
    )
  }
  await Promise.all(deltasPromises)

  const isGameOverForUser = deltas.some(delta => delta.isBan)

  // Set this when they've claimed any cell, regardless of ban or not to
  // track the "play" state of the user
  await userSetPlayedIfNotExists({
    redis: ctx.redis,
    userId,
  })

  // User stats
  let newLevel: Level | undefined = undefined
  if (isGameOverForUser) {
    // to-do: put behind logging flag. This is going wild under heavy loads.
    // console.log(`Game over for ${userId}. Hit a mine!`)
    newLevel = await userDescendLevel({
      redis: ctx.redis,
      userId,
    })
  } else {
    // TODO: Use hSetNX when we have it
    await userSetLastPlayedChallenge({
      challengeNumber,
      redis: ctx.redis,
      userId,
    })

    await userIncrementLastPlayedChallengeClaimedCells({
      userId,
      redis: ctx.redis,
      // Since it's not game over, user gets all the deltas produced
      incrementBy: deltas.length,
    })
  }

  const teamNumber = getTeamFromUserId(userId)
  if (isGameOverForUser) {
    await teamStatsMinesHitIncrementForMember({
      challengeNumber,
      member: teamNumber,
      redis: ctx.redis,
    })
  }

  // Team stats are incremented by partition
  const teamStatsPromises = []
  for (const [partitionKey, partitionDeltas] of deltasByPartitionKey) {
    const partitionXY = parsePartitionXY(partitionKey)
    teamStatsPromises.push(
      teamStatsCellsClaimedIncrementForMemberPartitioned(
        ctx.redis,
        challengeNumber,
        partitionXY,
        teamNumber,
        // Mines count as claims since the scoring algorithm counts all squares
        partitionDeltas.length,
      ),
    )
  }
  await Promise.all(teamStatsPromises)

  return {
    newLevel,
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
  batch: BatchItemWithoutTeam[]
  fieldConfig: ChallengeConfig
  ctx: JobContext
  userId: T2
  fieldPartitionKey: ReturnType<typeof createFieldPartitionKey>
}): Promise<{
  /** Cells the user won */
  claimedCells: Delta[]
  /** Cells the user lost */
  lostCells: Delta[]
}> => {
  // Produce and operation for each coord that we want to claim. The return value
  // will be used to see if we successfully claimed the cell.
  const claimOps: BitfieldCommand[] = batch.map(
    ({localXY}): BitfieldCommand => [
      'set',
      'u1',
      coordsToOffset(
        enforceBounds({
          coord: localXY,
          cols: fieldConfig.partitionSize,
          rows: fieldConfig.partitionSize,
        }),
        fieldConfig.partitionSize,
      ),
      1,
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
  const bitfieldOps: BitfieldCommand[] = []

  // Iterate over the results of the claims operations and either
  // set (if value === 0) or get (if value === 1) so that the user
  // can see the final state for the cell.
  claimOpsReturn.forEach((value, i) => {
    const batchItem = batch[i]!

    if (value === 0) {
      // Edge case: It's possible this deviates if the set fails for some reason
      bitfieldOps.push([
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
    } else {
      bitfieldOps.push([
        'get',
        `u${FIELD_CELL_BITS}`,
        coordsToOffset(
          enforceBounds({
            coord: batchItem.localXY,
            cols: fieldConfig.partitionSize,
            rows: fieldConfig.partitionSize,
          }),
          fieldConfig.partitionSize,
        ),
      ])
    }
  })

  const teamOpsReturn = await ctx.redis.bitfield(
    fieldPartitionKey,
    // @ts-expect-error - not sure
    ...bitfieldOps.flat(),
  )

  // Produce the deltas from the write operation to be stored somewhere
  const claimedCells: Delta[] = []
  const lostCells: Delta[] = []
  teamOpsReturn.forEach((value, i) => {
    const batchItem = batch[i]
    if (!batchItem) return

    const opType = bitfieldOps[i]![0]
    if (!opType) return

    if (opType === 'get') {
      const decoded = decodeVTT(value)
      lostCells.push({
        globalXY: batchItem.globalXY,
        isBan: batchItem.isBan,
        team: decoded.team,
      })
    } else if (opType === 'set') {
      claimedCells.push({
        globalXY: batchItem.globalXY,
        isBan: batchItem.isBan,
        team: teamNumber,
      })
    } else {
      throw new Error(`Unimplemented op type: ${opType}`)
    }
  })

  metrics.claims.labels(fieldPartitionKey, 'false').inc(lostCells.length)
  metrics.claims.labels(fieldPartitionKey, 'true').inc(claimedCells.length)
  return {
    lostCells,
    claimedCells,
  }
}

/**
 * NOTE: Call levelsIsUserInRightPlace before this function to ensure
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
  ctx: JobContext
}): Promise<{
  /** Cells the user won */
  claimedCells: Delta[]
  /** Cells the user lost */
  lostCells: Delta[]
  /** If the user hits a ban box, this will be defined with the new level a user should be at */
  newLevel: Level | undefined
}> => {
  if (coords.length === 0)
    return {claimedCells: [], lostCells: [], newLevel: undefined}

  const start = performance.now()

  // We need a lookup here instead of passing in the config from blocks land
  // because blocks doesn't have the seed and other backend only pieces
  // of information that we need
  const fieldConfig = await challengeConfigGet({
    redis: ctx.redis,
    subredditId: ctx.subredditId,
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
    Object.entries(partitionBatchMap).map(
      async ([fieldPartitionKey, batch]) => {
        return await _fieldClaimCellsBitfieldOpsForPartition({
          batch,
          fieldPartitionKey: fieldPartitionKey as ReturnType<
            typeof createFieldPartitionKey
          >,
          ctx,
          fieldConfig,
          userId,
        })
      },
    ),
  )

  const claimedCells: Delta[] = fieldsOpsReturn.flatMap(
    ({claimedCells}) => claimedCells,
  )
  const lostCells: Delta[] = fieldsOpsReturn.flatMap(({lostCells}) => lostCells)

  const {newLevel} = await _fieldClaimCellsSuccess({
    challengeNumber,
    userId,
    deltas: claimedCells,
    ctx,
    fieldConfig,
  })

  metrics.claimDurations.labels().observe((performance.now() - start) / 1_000)

  // TODO: Where I return to client anything you need like user's scores and other things
  return {
    claimedCells,
    lostCells,
    newLevel,
  }
}

const getBlastRadius = (gridSize: number, radius: number, xy: XY): XY[] => {
  const blastRadius: XY[] = []

  for (let x = xy.x - radius; x <= xy.x + radius; x++) {
    for (let y = xy.y - radius; y <= xy.y + radius; y++) {
      try {
        const validCoord = enforceBounds({
          coord: {x, y},
          cols: gridSize,
          rows: gridSize,
        })
        blastRadius.push(validCoord)
      } catch (e) {
        // Skip invalid coordinates (out of bounds)
      }
    }
  }

  return blastRadius
}

/**
 * @internal
 *
 * The actual bitfield operations ran for a partition. Broken out for testing only.
 */
const _fieldNukeCellsBitfieldOpsForPartition = async ({
  batch,
  fieldConfig,
  ctx,
  fieldPartitionKey,
}: {
  batch: BatchItemWithTeam[]
  fieldConfig: ChallengeConfig
  ctx: JobContext
  fieldPartitionKey: ReturnType<typeof createFieldPartitionKey>
}): Promise<void> => {
  const bitfieldOps: BitfieldCommand[] = []

  // Iterate over the results of the claims operations and either
  // set (if value === 0) or get (if value === 1) so that the user
  // can see the final state for the cell.
  batch.forEach((_value, i) => {
    const batchItem = batch[i]!

    bitfieldOps.push([
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
      encodeVTT(1, batchItem.team),
    ])
  })

  await ctx.redis.bitfield(
    fieldPartitionKey,
    // @ts-expect-error - not sure
    ...bitfieldOps.flat(),
  )
}

/** Nukes cells for a given area around a global XY */
export const fieldNukeCells = async ({
  coord,
  blastRadius,
  userId,
  challengeNumber,
  ctx,
}: {
  /** Central point to blast around */
  coord: XY
  /** How many cells to blast around the coord */
  blastRadius: number
  userId: T2
  challengeNumber: number
  ctx: JobContext
}): Promise<void> => {
  // We need a lookup here instead of passing in the config from blocks land
  // because blocks doesn't have the seed and other backend only pieces
  // of information that we need
  const fieldConfig = await challengeConfigGet({
    redis: ctx.redis,
    subredditId: ctx.subredditId,
    challengeNumber,
  })

  const profile = await userGet({redis: ctx.redis, userId})

  if (!profile.superuser) {
    throw new Error('Must be a super user to nuke cells')
  }

  const batch: BatchItemWithTeam[] = getBlastRadius(
    fieldConfig.size,
    blastRadius,
    coord,
  ).map((item, i) => ({
    globalXY: item,
    // Assume all are valid for this operation
    isBan: false,
    // Rainbowify!!
    team: teams[i % teams.length]!,
    ...getPartitionAndLocalCoords(item, fieldConfig.partitionSize),
  }))

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

  await Promise.all(
    Object.entries(partitionBatchMap).map(([fieldPartitionKey, batch]) =>
      _fieldNukeCellsBitfieldOpsForPartition({
        batch,
        fieldPartitionKey: fieldPartitionKey as ReturnType<
          typeof createFieldPartitionKey
        >,
        ctx,
        fieldConfig,
      }),
    ),
  )

  // Calculate the increment for all teams by dividing the total number of cells
  // in the batch by the number of teams, rounding up to ensure all teams are awarded
  // the same amount (even if the grid doesn't divide evenly).
  const incrementAllTeamsBy = Math.ceil(batch.length / teams.length)

  // Increment the total claimed cells for each team by the calculated amount.
  // The downside is that it's possible to end the game "early" since some cells
  // will be double counted. Since games are meaningless I think it's ok.
  await Promise.all(
    teams.map(team =>
      teamStatsCellsClaimedIncrementForMemberTotal(
        ctx.redis,
        challengeNumber,
        team,
        incrementAllTeamsBy,
      ),
    ),
  )
}

/**
 * Gets the bitfield for a given challenge in order.
 *
 * NOTE: This is only for testing right now until we find a more efficient
 * way to return all items in a bitfield. At a minimum, we need to the
 * partition a required command so we don't risk sending 10 million bits at once.
 *
 * @returns Array of numbers (you need to decode with decodeVTT). If the partition
 * does not yet exist in redis, returns empty array!
 */
export const fieldGet = async ({
  challengeNumber,
  subredditId,
  redis,
  partitionXY,
}: {
  challengeNumber: number
  subredditId: string
  redis: Devvit.Context['redis']
  partitionXY: XY
}): Promise<number[]> => {
  const meta = await challengeConfigGet({redis, subredditId, challengeNumber})

  validateFieldArea(meta.size)

  const data = await redis.strLen(
    createFieldPartitionKey(challengeNumber, partitionXY),
  )
  if (data === 0) return []

  let bytes = await redis.getBuffer(
    createFieldPartitionKey(challengeNumber, partitionXY),
  )
  if (!bytes) {
    return []
  }
  const expectedLength = Math.ceil(
    (meta.partitionSize * meta.partitionSize) / 8,
  )
  if (bytes.length < expectedLength) {
    // Pad with zeros so we don't have to worry about bounds checking.
    const trunc = bytes
    bytes = new Buffer(expectedLength)
    bytes.set(trunc)
  }
  const nums = new Array<number>(meta.partitionSize * meta.partitionSize)

  const getu3 = (idx: number) => {
    const bitIdx = idx * 3
    const msbIdx = Math.floor(bitIdx / 8)
    switch (bitIdx % 8) {
      case 6: {
        // Overflows by 1 bit into next byte.
        const b0 = bytes[msbIdx]!
        const b1 = bytes[msbIdx + 1]!
        return ((b0 & 3) << 1) | ((b1 >> 7) & 1)
      }
      case 7: {
        // Overflows by 2 bits into next byte.
        const b0 = bytes[msbIdx]!
        const b1 = bytes[msbIdx + 1]!
        return ((b0 & 1) << 2) | ((b1 >> 6) & 3)
      }
      default:
        return (bytes[msbIdx]! >> (5 - (bitIdx % 8))) & 7
    }
  }
  for (let i = 0; i < nums.length; i++) {
    nums[i] = getu3(i)
  }
  return nums
}

export async function fieldGetPartitionMapEncoded(
  redis: Devvit.Context['redis'],
  subredditId: string,
  challengeNumber: number,
  partitionXY: XY,
): Promise<string> {
  const codec = new MapCodec()
  const map = await fieldGetPartitionMap(
    redis,
    subredditId,
    challengeNumber,
    partitionXY,
  )
  const bytes = codec.encode(map.values())
  return Buffer.from(bytes).toString('base64')
}

export async function fieldSetPartitionMapLatestSnapshotKey(
  redis: Devvit.Context['redis'],
  key: DeltaSnapshotKey,
): Promise<void> {
  await redis.set(
    createFieldPartitionLatestSnapshotKey(key.challengeNumber, key.partitionXY),
    String(key.sequenceNumber),
  )
}

export async function fieldGetPartitionMapLatestSnapshotKey(
  redis: Devvit.Context['redis'],
  pathPrefix: string,
  subredditId: string,
  challengeNumber: number,
  partitionXY: XY,
): Promise<DeltaSnapshotKey | undefined> {
  try {
    const latestSequenceNumber = Number.parseInt(
      (await redis.get(
        createFieldPartitionLatestSnapshotKey(challengeNumber, partitionXY),
      )) || '',
    )
    if (latestSequenceNumber >= 0) {
      return {
        kind: 'partition',
        subredditId,
        pathPrefix,
        challengeNumber,
        partitionXY,
        sequenceNumber: latestSequenceNumber,
        noChange: false,
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERR no such key')) {
      return undefined
    }
    throw error
  }
}

export async function fieldPartitionPublish(
  uploader: Uploader,
  pathPrefix: string,
  redis: Devvit.Context['redis'],
  subredditId: string,
  challengeNumber: number,
  sequenceNumber: number,
  partitionXY: XY,
): Promise<DeltaSnapshotKey> {
  // Attempt up to 5 times to read the precomputed encoding of the partition.
  // This is a read-after-write, so there's always some chance that we're
  // trying to read this through a stale replica.
  let encodedB64: string | undefined = undefined
  let attempts = 0
  const maxAttempts = 5
  while (attempts < maxAttempts) {
    attempts++
    // TODO: Use getBuffer to avoid base64 encoding.
    encodedB64 = await redis.get(
      createFieldPartitionSnapshotKey(
        challengeNumber,
        partitionXY,
        sequenceNumber,
      ),
    )
    if (encodedB64 !== undefined) {
      break
    }
    await new Promise(resolve => setTimeout(resolve, attempts * 10))
  }
  if (encodedB64 === undefined) {
    throw new Error(
      `unable to get buffer for challengeNumber=${challengeNumber}, sequenceNumber=${sequenceNumber}`,
    )
  }

  const encoded = Buffer.from(encodedB64, 'base64')

  // For some reason the S3 request is getting corrupted if I don't use a fresh copy.
  const copy = Buffer.alloc(encoded.length)
  encoded.copy(copy)
  const key: DeltaSnapshotKey = {
    kind: 'partition',
    pathPrefix,
    subredditId,
    challengeNumber,
    partitionXY,
    sequenceNumber,
    noChange: false,
  }
  await uploader.upload(key, copy)
  return key
}

export async function fieldGetPartitionMap(
  redis: Devvit.Context['redis'],
  subredditId: string,
  challengeNumber: number,
  partitionXY: XY,
): Promise<FieldMap> {
  const meta = await challengeConfigGet({redis, subredditId, challengeNumber})
  const n = meta.partitionSize * meta.partitionSize
  const cells: FieldMap = new Array<FieldMap[number]>(n)

  const fieldData = await fieldGet({
    challengeNumber,
    subredditId,
    redis,
    partitionXY,
  })
  for (let i = 0; i < n; i++) {
    const {claimed, team} = decodeVTT(fieldData[i]!)
    if (!claimed) {
      continue
    }
    const localXY = {
      x: i % meta.partitionSize,
      y: Math.floor(i / meta.partitionSize),
    }
    const globalXY = getGlobalCoords(partitionXY, localXY, meta.partitionSize)
    cells[i] = {
      team,
      isBan: minefieldIsMine({
        seed: meta.seed,
        coord: globalXY,
        config: {mineDensity: meta.mineDensity},
      }),
    }
  }
  return cells
}

export const fieldGetDeltas = async ({
  challengeNumber,
  subredditId,
  redis,
  partitionXY,
}: {
  challengeNumber: number
  subredditId: string
  redis: Devvit.Context['redis']
  partitionXY: XY
}): Promise<Delta[]> => {
  const meta = await challengeConfigGet({redis, subredditId, challengeNumber})
  const deltas: Delta[] = []
  const map = await fieldGetPartitionMap(
    redis,
    subredditId,
    challengeNumber,
    partitionXY,
  )
  for (let i = 0; i < map.length; i++) {
    const cell = map[i]
    if (!cell) {
      // Not yet revealed!
      continue
    }
    const localXY = {
      x: i % meta.partitionSize,
      y: Math.floor(i / meta.partitionSize),
    }
    const globalXY = getGlobalCoords(partitionXY, localXY, meta.partitionSize)
    deltas.push({
      globalXY,
      isBan: cell.isBan,
      team: cell.team!,
    })
  }
  return deltas
}
