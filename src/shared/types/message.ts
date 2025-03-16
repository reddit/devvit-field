import type {DeltaSnapshotKey} from '../codecs/deltacodec.ts'
import type {Player, Profile} from '../save.ts'
import type {Team} from '../team.ts'
import type {XY} from './2d.ts'
import type {AppConfig} from './app-config.ts'
import type {FieldConfig} from './field-config.ts'
import type {Delta} from './field.ts'
import type {Level, LevelPascalCase} from './level.ts'
import type {Seed} from './random.ts'
import type {T5} from './tid.ts'

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
  | SetTimeoutMessage

export type InitDevvitMessage = {
  appConfig: AppConfig
  /** Number of players banned. */
  bannedPlayers: number
  challenge: number
  /** Connected may be sent before Registered. Reinit status. */
  connected: boolean
  /**
   * Configure iframe lifetime debug mode. This is by request in devvit but that
   * granularity doesn't make sense in the iframe.
   */
  debug: boolean
  field: FieldConfig
  lvl: Level
  p1: Player
  /** Number of boxes claimed by the player in the current level. */
  p1BoxCount: number
  /** Number of players online including p1; 0 when offline. */
  players: number
  seed?: Seed
  /**
   * The subreddit name without an r/ prefix. Eg, BananaField. The field level
   * when not in a dev sub.
   */
  sub: LevelPascalCase | string
  t5: T5
  team: Team
  teamBoxCounts: TeamBoxCounts
  type: 'Init'
  /** Number of boxes in the field visible; [0, field size]. */
  visible: number
  /** The starting global coordinates for the player */
  initialGlobalXY: XY
  /** The deltas for the partition the user starts in */
  initialMapKey?: DeltaSnapshotKey
  /** Will be true if this is the init message to play a new challenge */
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
  /** Player has acknowledged the dialog. */
  | {type: 'OnNextChallengeClicked'}
  /** Player has acknowledged the dialog. */
  | DialogMessage
  /** Player has tapped the r/GamesOnReddit leaderboard open button. */
  | {type: 'OpenLeaderboard'}
  | {type: 'OnClaimGlobalPointClicked'}
  /** The entire app should be reloaded. */
  | {type: 'ReloadApp'}
  /** Only lives here because the iFrame produces Jitter and forwards us this message back over to block to handle */
  | ChallengeCompleteMessage

/** A realtime message from another instance or server broadcast. */
export type RealtimeMessage =
  | BoxRealtimeMessage
  | FieldBroadcast
  | ConfigUpdateMessage
  | ChallengeCompleteMessage
  | PartitionUpdate
  | LeaderboardUpdate

/** Sent on response to claiming a box. */
type ClaimBoxesResponse = {
  type: 'Box'
  lostCells: Delta[]
  claimedCells: Delta[]
}

export type PartitionUpdate = {
  type: 'PartitionUpdate'
  key: DeltaSnapshotKey
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

export type LeaderboardUpdate = {
  type: 'LeaderboardUpdate'
  teamBoxCounts: TeamBoxCounts
  bannedPlayers: number
  activePlayers: number
}

export type ConfigUpdateMessage = {
  type: 'ConfigUpdate'
  config: AppConfig
}

/** Trigger an event later, by sending it to the iframe to schedule. */
export type SetTimeoutMessage = {
  type: 'SetTimeout'
  timeoutMillis: number
  message: IframeMessage
}

type DialogMessageBase = {
  type: 'Dialog'
  redirectURL: string
  message: string
}

export type DialogMessage =
  | (DialogMessageBase & {
      code: 'WrongLevelBanned' | 'GlobalPointClaimed' | 'ClaimedABanBox'
    })
  | (DialogMessageBase & {
      profile: Profile
      code: 'ChallengeEndedAscend'
    })
  | (DialogMessageBase & {
      profile: Profile
      code: 'ChallengeEndedStay'
    })

// TODO: Remove if there are no peer to peer messages. We won't have peer for things like
// scheduled jobs
/** Base realtime message sent or received. */
export type RealtimeSystemMessage = {
  peer: Player
  /** Message schema version. */
  version: number
}

/**
 * Team scores in boxes for a given field. This is different than the score for
 * completing a descent loop.
 *
 * TODO: I'm not sure if you want this by team order OR by points descending. I figured
 * you wanted by team number in order so you could infer the team from the index.
 */
export type TeamBoxCounts = [t0: number, t1: number, t2: number, t3: number]

/** Message schema version supported by this instance. */
export const realtimeVersion: number = 0
