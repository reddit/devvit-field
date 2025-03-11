import type {Devvit} from '@devvit/public-api'
import {
  DeltaCodec,
  type DeltaSnapshotKey,
} from '../../../shared/codecs/deltacodec.js'
import {makePartitionKey} from '../../../shared/partition'
import type {XY} from '../../../shared/types/2d'
import type {Delta} from '../../../shared/types/field'

export interface Uploader {
  upload(key: DeltaSnapshotKey, body: Buffer): Promise<void>
}

const getChallengeDeltasKey = (challengeNumber: number, partitionXY: XY) =>
  `challenge:${challengeNumber}:deltas:${makePartitionKey(partitionXY)}` as const

const getChallengeDeltasSnapshotKey = (
  challengeNumber: number,
  partitionXY: XY,
  sequenceNumber: number,
) =>
  `{${getChallengeDeltasKey(challengeNumber, partitionXY)}}:${sequenceNumber}` as const

export const getChallengeDeltasEncodedSnapshotKey = (
  challengeNumber: number,
  partitionXY: XY,
  sequenceNumber: number,
) =>
  `${getChallengeDeltasSnapshotKey(challengeNumber, partitionXY, sequenceNumber)}:encoded`

export async function deltasGet(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
): Promise<Delta[]> {
  const deltas = await redis.zRange(
    getChallengeDeltasKey(challengeNumber, partitionXY),
    0,
    -1,
  )

  return deltas.map(x => JSON.parse(x.member))
}

export async function deltasAdd(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
  deltas: Delta[],
): Promise<void> {
  if (deltas.length === 0) return
  await redis.zAdd(
    getChallengeDeltasKey(challengeNumber, partitionXY),
    ...deltas.map(x => ({
      score: Date.now(),
      member: JSON.stringify(x),
    })),
  )
}

export async function deltasClear(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  partitionXY: XY,
): Promise<void> {
  // TODO: Would deleting the key be faster?
  await redis.zRemRangeByRank(
    getChallengeDeltasKey(challengeNumber, partitionXY),
    0,
    -1,
  )
}

/**
 * Renames a partitioned deltas set to be queued up for processing.
 * Old key:
 *  challenge:${challengeNumber}:deltas:px_${p.x}__py_${p.y}
 * New key:
 *  {challenge:${challengeNumber}:deltas:px_${p.x}__py_${p.y}}:${sequenceNumber}
 * @param redis
 * @param challengeNumber
 * @param sequenceNumber
 * @param partitionXY
 * @param partitionSize
 */
export async function deltasRotate(
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  sequenceNumber: number,
  partitionXY: XY,
  partitionSize: number,
): Promise<void> {
  let deltas: Delta[] | undefined
  const deltasKey = getChallengeDeltasKey(challengeNumber, partitionXY)
  const versionedKey = getChallengeDeltasSnapshotKey(
    challengeNumber,
    partitionXY,
    sequenceNumber,
  )
  try {
    await redis.rename(deltasKey, versionedKey)
    await redis.expire(versionedKey, 3600)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERR no such key')) {
      // No deltas must've accumulated. Record empty snapshot.
      deltas = []
    } else {
      throw error
    }
  }

  if (deltas === undefined) {
    const members = await redis.zRange(versionedKey, 0, -1)
    deltas = members.map(({member}) => {
      return JSON.parse(member)
    })
  }

  const codec = new DeltaCodec(partitionXY, partitionSize)
  const encoded = codec.encode(deltas)

  await redis.set(
    getChallengeDeltasEncodedSnapshotKey(
      challengeNumber,
      partitionXY,
      sequenceNumber,
    ),
    // TODO: Use setBuffer to avoid base64 encoding.
    Buffer.from(encoded).toString('base64'),
    {expiration: new Date(Date.now() + 3600_000)},
  )
}

export async function deltasPublish(
  uploader: Uploader,
  pathPrefix: string,
  redis: Devvit.Context['redis'],
  challengeNumber: number,
  sequenceNumber: number,
  partitionXY: XY,
): Promise<DeltaSnapshotKey> {
  // Attempt up to 5 times to read the precomputed encoding of the deltas.
  // This is a read-after-write, so there's always some chance that we're
  // trying to read this through a stale replica.
  let encodedB64: string | undefined = undefined
  let attempts = 0
  const maxAttempts = 5
  while (attempts < maxAttempts) {
    attempts++
    // TODO: Use getBuffer to avoid base64 encoding.
    encodedB64 = await redis.get(
      getChallengeDeltasEncodedSnapshotKey(
        challengeNumber,
        partitionXY,
        sequenceNumber,
      ),
    )
    if (encodedB64 !== undefined) {
      break
    }
    // TODO: Fix getBuffer so it returns a new array that isn't reused elsewhere.
    await new Promise(resolve => setTimeout(resolve, attempts * 10))
  }
  if (encodedB64 === undefined) {
    throw new Error(
      `unable to get buffer for challengeNumber=${challengeNumber}, sequenceNumber=${sequenceNumber}`,
    )
  }

  const encoded = Buffer.from(encodedB64, 'base64')
  // TODO: return the url from upload directly
  // TODO: get path prefix from settings

  // For some reason the S3 request is getting corrupted if I don't use a fresh copy.
  const copy = Buffer.alloc(encoded.length)
  encoded.copy(copy)
  const key: DeltaSnapshotKey = {
    pathPrefix,
    challengeNumber,
    partitionXY,
    sequenceNumber,
  }
  await uploader.upload(key, copy)
  return key
}
