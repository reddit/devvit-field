import type {Player, PostSeed} from '../save.ts'
import type {XY} from './2d.ts'
import type {FieldConfig} from './field-config.ts'

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
  | RealtimeMessage

export type InitDevvitMessage = {
  /** Connected may be sent before Registered. Reinit status. */
  connected: boolean
  /**
   * Configure iframe lifetime debug mode. this is by request in devvit but that
   * granularity doesn't make sense in the iframe.
   */
  debug: boolean
  field: FieldConfig
  p1: Player
  seed: PostSeed
  type: 'Init'
}

/** The Devvit API wraps all messages from Blocks to the iframe. */
export type DevvitSystemMessage = {
  data: {message: DevvitMessage}
  type?: 'devvit-message'
}

/** A message from the iframe to devvit. */
export type IframeMessage =
  /** Iframe has registered a message listener. */
  | {type: 'Registered'}
  /** Expand the iframe beyond the post boundaries. */
  | {type: 'PopOut'}

/** A realtime message from another instance or server broadcast. */
export type RealtimeMessage = CellRealtimeMessage | FieldBroadcast

/** Broadcasted by server when a cell has changed. */
export type CellRealtimeMessage = RealtimeSystemMessage & {
  type: 'Cell'
  cell: 'Ban' | 'Clear'
  xy: XY
}

/** Broadcasted by server when a new field URL is available. */
export type FieldBroadcast = {type: 'Field'; url: string}

/** Base realtime message sent or received. */
export type RealtimeSystemMessage = {
  peer: Player
  /** Message schema version. */
  version: number
}

/** Message schema version supported by this instance. */
export const realtimeVersion: number = 0
