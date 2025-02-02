import type {Player, PostSeed} from '../../shared/save.ts'
import type {Random} from '../../shared/types/random.ts'
import type {UTCMillis} from '../../shared/types/time.ts'
import type {AssetMap} from '../asset-map.ts'
import type {AudioBufferByName} from '../audio.ts'
import type {Cam} from '../cam.ts'
import type {C2D} from '../canvas/c2d.ts'
import type {TextureMap} from '../canvas/texture-map.ts'
import type {EIDFactory} from '../ents/eid.ts'
import type {Zoo} from '../ents/zoo.ts'
import type {DefaultButton, Input} from '../input/input.ts'
import type {Looper} from './looper.ts'

/** A drawable loaded game. */
export type Game = LoadedGame & {c2d: C2D; textures: TextureMap}

export type LoadedGame = InitGame &
  PreloadGame & {
    audio: AudioBufferByName
    // cursor: CursorEnt
    img: AssetMap['img']
  }

export type PreloadGame = {
  ac: AudioContext
  c2d?: C2D | undefined
  cam: Cam
  canvas: HTMLCanvasElement
  connected: boolean
  ctrl: Input<DefaultButton>
  debug: boolean
  devPeerChan: BroadcastChannel | undefined
  eid: EIDFactory
  init: Promise<void>
  looper: Looper
  now: UTCMillis
  textures?: TextureMap | undefined
  zoo: Zoo
} & Partial<InitGame>

/** State derived from InitDevvitMessage. */
export type InitGame = {
  connected: boolean
  debug: boolean
  p1: Player
  rnd: Random
  seed: PostSeed
}

// to-do: SavableGame for LocalStorage savable state.
