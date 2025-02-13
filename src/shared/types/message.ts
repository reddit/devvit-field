import type {Player} from '../save.ts'
import type {Team} from '../team.ts'
import type {XY} from './2d.ts'
import type {FieldConfig} from './field-config.ts'
import type {Seed} from './random.ts'

/**
 * A message from Blocks to the iframe. Init doesn't necessarily arrive first.
 */
export type DevvitMessage =
  /**
   * Sent in response to Registered to initialize the iframe once it is known to
   * be listening.
   */
  | InitDevvitMessage
  | {type: 'Connected'}
  | {type: 'Disconnected'}
  | ClaimCellsResponse
  | RealtimeMessage

export type InitDevvitMessage = {
  /** Connected may be sent before Registered. Reinit status. */
  connected: boolean
  /**
   * Configure iframe lifetime debug mode. This is by request in devvit but that
   * granularity doesn't make sense in the iframe.
   */
  debug: boolean
  field: FieldConfig
  mode: IframeMode
  p1: Player
  seed?: Seed
  type: 'Init'
}

/** The Devvit API wraps all messages from Blocks to the iframe. */
export type DevvitSystemMessage = {
  data: {message: DevvitMessage}
  type?: 'devvit-message'
}

/** A message from the iframe to devvit. */
export type IframeMessage =
  /** Iframe is rendering. */
  | {type: 'Loaded'}
  /** Iframe has registered a message listener. */
  | {type: 'Registered'}
  /** Expand the iframe beyond the post boundaries. */
  | {type: 'PopOut'}
  /** Attempt to submit a batch of cells that have been clicked */
  | {type: 'ClaimCells'; cells: XY[]}

/** A realtime message from another instance or server broadcast. */
export type RealtimeMessage =
  | CellRealtimeMessage
  | FieldBroadcast
  | ChallengeCompleteMessage

type ClaimCellsResponse = {
  type: 'Cell'
  boxes: {cell: 'Ban' | 'Clear'; xy: XY; team: Team}[]
}

/** Broadcasted by server when a cell has changed. */
export type CellRealtimeMessage = RealtimeSystemMessage & ClaimCellsResponse

/** Broadcasted by server when a new field URL is available. */
export type FieldBroadcast = {type: 'Field'; url: string}

/** Triggered when a challenge is completed */
export type ChallengeCompleteMessage = {
  type: 'ChallengeComplete'
  challengeNumber: number
  standings: {member: Team; score: number}[]
}

/** Base realtime message sent or received. */
export type RealtimeSystemMessage = {
  peer: Player
  /** Message schema version. */
  version: number
}

/** Whether the iframe is hosted in the post (pop-in) or a dialog (pop-out). */
export type IframeMode = 'PopIn' | 'PopOut'

/** Message schema version supported by this instance. */
export const realtimeVersion: number = 0
