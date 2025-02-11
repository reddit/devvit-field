import type {Team} from '../../../shared/team'
import type {XY} from '../../../shared/types/2d'

export type Delta = {
  coord: XY
  team: Team
}

// TODO: Data structure to store deltas in redis

// TODO: Produce a partitioned list of deltas to send to the client
