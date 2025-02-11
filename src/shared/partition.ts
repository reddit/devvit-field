import type {PartitionXY, XY} from './types/2d'

/**
 * Given a cord and partition size, returns coords of the partition. This
 * coords of the partition are essentially the ID of the partition.
 */
export function getPartitionCoords(
  coord: XY,
  partitionSize: number,
): PartitionXY {
  return {
    partitionX: Math.floor(coord.x / partitionSize),
    partitionY: Math.floor(coord.y / partitionSize),
  }
}
