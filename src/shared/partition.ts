import type {PartitionKey, XY} from './types/2d'
import type {ChallengeConfig} from './types/challenge-config'

export type Layout = {
  size: number
  partitionSize: number
}

export const parsePartitionXY = (partitionKey: PartitionKey): XY => {
  const [_, partitionX, partitionY] =
    partitionKey.match(/px_(\d+)__py_(\d+)/) ?? []

  const x = Number(partitionX)
  const y = Number(partitionY)

  if (Number.isNaN(x) || Number.isNaN(y)) {
    throw new Error(
      `Invalid partition key, got NaN: ${partitionKey}. Values: ${x}, ${y}`,
    )
  }

  if (x < 0 || y < 0) {
    throw new Error(
      `Invalid partition key, got negative values: ${partitionKey}. Values: ${x}, ${y}`,
    )
  }

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error(
      `Invalid partition key, got non-integer values: ${partitionKey}. Values: ${x}, ${y}`,
    )
  }

  return {x, y}
}

export const makePartitionKey = (partition: Readonly<XY>): PartitionKey =>
  `px_${partition.x}__py_${partition.y}`

/**
 * Given a cord and partition size, returns coords of the partition. This
 * coords of the partition are essentially the ID of the partition.
 *
 * NOTE: Does not enforce bounds checking for the global coordinate.
 */
export function getPartitionCoords(globalCoord: XY, partitionSize: number): XY {
  return {
    x: Math.floor(globalCoord.x / partitionSize),
    y: Math.floor(globalCoord.y / partitionSize),
  }
}

/**
 * Given a global coordinate and partition size, returns the local coordinate inside the partition.
 *
 * NOTE: Does not enforce bounds checking for the global coordinate.
 */
export function getLocalCoords(globalCoord: XY, partitionSize: number): XY {
  return {
    x: globalCoord.x % partitionSize,
    y: globalCoord.y % partitionSize,
  }
}

/**
 * Given a global coordinate and partition size, returns both partition and local coordinates.
 *
 * NOTE: Does not enforce bounds checking for the global coordinate.
 */
export function getPartitionAndLocalCoords(
  globalCoord: XY,
  partitionSize: number,
): {partitionXY: XY; localXY: XY} {
  return {
    partitionXY: getPartitionCoords(globalCoord, partitionSize),
    localXY: getLocalCoords(globalCoord, partitionSize),
  }
}

/**
 * Given a partition coordinate and a local coordinate within that partition,
 * returns the global coordinate.
 */
export function getGlobalCoords(
  partitionXY: XY,
  localXY: XY,
  partitionSize: number,
): XY {
  return {
    x: partitionXY.x * partitionSize + localXY.x,
    y: partitionXY.y * partitionSize + localXY.y,
  }
}

export function generatePartitionKeys(
  config: Pick<ChallengeConfig, 'size' | 'partitionSize'>,
): PartitionKey[] {
  const pps = partitionsPerSide(config)
  const partitionKeys: PartitionKey[] = []

  for (let x = 0; x < pps; x++) {
    for (let y = 0; y < pps; y++) {
      partitionKeys.push(`px_${x}__py_${y}`)
    }
  }

  return partitionKeys
}

export function partitionsPerSide({
  size,
  partitionSize,
}: {size: number; partitionSize: number}): number {
  return size / partitionSize
}

export function* partitionKeys(layout: Layout): IterableIterator<PartitionKey> {
  for (const {x, y} of partitionXYs(layout)) {
    yield `px_${x}__py_${y}`
  }
}

export function* partitionXYs(layout: Layout): IterableIterator<XY> {
  const pps = partitionsPerSide(layout)
  for (let x = 0; x < pps; x++) {
    for (let y = 0; y < pps; y++) {
      yield {x, y}
    }
  }
}
