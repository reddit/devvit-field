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
  | ClaimBoxesResponse
  | RealtimeMessage

export type InitDevvitMessage = {
  challenge: number
  /** Connected may be sent before Registered. Reinit status. */
  connected: boolean
  /**
   * Configure iframe lifetime debug mode. This is by request in devvit but that
   * granularity doesn't make sense in the iframe.
   */
  debug: boolean
  field: FieldConfig
  /** The level and subreddit name without an r/ prefix. Eg, BananaField. */
  lvl: string
  mode: IframeMode
  p1: Player
  /** Number of players online including p1; 0 when offline. */
  players: number
  /** Team score. */
  score: number
  seed?: Seed
  team: string
  type: 'Init'
  /** Number of boxes in the field visible; [0, field size]. */
  visible: number
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
  /** Attempt to submit a batch of boxes that have been clicked */
  | {type: 'ClaimBoxes'; boxes: XY[]}

/** A realtime message from another instance or server broadcast. */
export type RealtimeMessage =
  | BoxRealtimeMessage
  | FieldBroadcast
  | ChallengeCompleteMessage

type ClaimBoxesResponse = {
  type: 'Box'
  boxes: {box: 'Ban' | 'Empty'; xy: XY; team: Team}[]
}

/** Broadcasted by server when a box has changed. */
export type BoxRealtimeMessage = RealtimeSystemMessage & ClaimBoxesResponse

/** Broadcasted by server when a new field URL is available. */
export type FieldBroadcast = {type: 'Field'; url: string}

/** Triggered when a challenge is completed */
export type ChallengeCompleteMessage = {
  type: 'ChallengeComplete'
  challengeNumber: number
  standings: {member: Team; score: number}[]
}

// TODO: Remove if there are no peer to peer messages. We won't have peer for things like
// scheduled jobs
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
