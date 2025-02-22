import type {Player} from '../save.ts'
import type {Team} from '../team.ts'
import type {XY} from './2d.ts'
import type {FieldConfig} from './field-config.ts'
import type {Delta, FieldSub} from './field.ts'
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
  | DialogMessage
  | {type: 'ContinueToNextChallenge'}

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
  mode: IframeMode
  p1: Player
  /** Number of players online including p1; 0 when offline. */
  players: number
  seed?: Seed
  /**
   * The subreddit name without an r/ prefix. Eg, BananaField. The field level
   * when not in a dev sub.
   */
  sub: FieldSub | string
  team: Team
  teamBoxCounts: TeamBoxCounts
  type: 'Init'
  /** Number of boxes in the field visible; [0, field size]. */
  visible: number
  /** The starting global coordinates for the player */
  initialGlobalXY: XY
  /** The deltas for the partition the user starts in */
  initialDeltas: Delta[]
  /** Will be true if this is the init message to play a new found */
  reinit?: boolean
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
  /** Attempt to submit a batch of boxes that have been clicked */
  | {type: 'ClaimBoxes'; boxes: XY[]}
  /** Report partition subscriptions requested. */
  | {
      type: 'ConnectPartitions'
      /**
       * The set of partition subscriptions currently wanted identified by
       * global origin. The iframe assumes any unwanted connections will be
       * disconnected and existing connections still wanted will remain
       * unchanged.
       */
      parts: XY[]
    }
  /** Used on the click for next round, */
  | {type: 'OnNextChallengeClicked'}
  /** Used when there is a very special point to be claimed */
  | {type: 'ClaimGlobalPointForTeam'}

/** A realtime message from another instance or server broadcast. */
export type RealtimeMessage =
  | BoxRealtimeMessage
  | FieldBroadcast
  | ChallengeCompleteMessage

type ClaimBoxesResponse = {
  type: 'Box'
  deltas: Delta[]
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

/** Triggered when a challenge is completed */
export type DialogMessage = {
  type: 'Dialog'
  redirectURL: string
  message: string
  code: 'WrongLevel'
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

/**
 * Team scores in boxes for a given field. This is different than the score for
 * completing a descent loop.
 */
export type TeamBoxCounts = [number, number, number, number]

/** Message schema version supported by this instance. */
export const realtimeVersion: number = 0
