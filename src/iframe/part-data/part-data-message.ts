import type {DeltaSnapshotKey} from '../../shared/codecs/deltacodec.ts'
import type {Delta} from '../../shared/types/field.ts'
import type {V4} from '../../shared/types/v4.ts'

export type PartDataFetcherMessage =
  | {type: 'Fetch'; key: DeltaSnapshotKey; partSize: number; workerID: V4}
  /** Abort any pending request and self-terminate. */
  | {type: 'Kill'}

export type PartDataWorkerMessage = {
  type: 'Cells'
  /** Undefined on error. */
  cells: Delta[] | ArrayBuffer | undefined
  key: DeltaSnapshotKey
  workerID: V4
}
