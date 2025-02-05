import type {Player, PostSeed} from '../../shared/save.ts'
import {minCanvasWH, paletteDark} from '../../shared/theme.ts'
import type {
  DevvitMessage,
  DevvitSystemMessage,
  IframeMessage,
} from '../../shared/types/message.ts'
import {Random, type Seed} from '../../shared/types/random.ts'
import {SID} from '../../shared/types/sid.ts'
import {type UTCMillis, utcMillisNow} from '../../shared/types/time.ts'
import type {AssetMap} from '../asset-map.ts'
import type {AudioBufferByName} from '../audio.ts'
import {devProfiles} from '../dev-profiles.ts'
import {EIDFactory} from '../ents/eid.ts'
import {FieldLevel} from '../ents/levels/field-level.ts'
import {Zoo} from '../ents/zoo.ts'
import type {Atlas} from '../graphics/atlas.ts'
import {type DefaultButton, Input} from '../input/input.ts'
import {BitmapAttribBuffer} from '../renderer/attrib-buffer.ts'
import {Cam} from '../renderer/cam.ts'
import {Renderer} from '../renderer/renderer.ts'
import atlas from './atlas.json' with {type: 'json'}
import type {Tag} from './config.ts'
import {Looper} from './looper.ts'

/** State derived from InitDevvitMessage. */
export type InitGame = {
  connected: boolean
  debug: boolean
  p1: Player
  rnd: Random
  seed: PostSeed
}

// to-do: SavableGame for LocalStorage savable state.

export class Game {
  // to-do: encapsulate and review need for pre vs postload state given load screen is in HTML.
  ac: AudioContext
  atlas: Atlas<Tag>
  audio?: AudioBufferByName
  bmps: BitmapAttribBuffer
  cam: Cam
  canvas: HTMLCanvasElement
  connected: boolean
  ctrl: Input<DefaultButton>
  debug: boolean
  devPeerChan: BroadcastChannel | undefined
  eid: EIDFactory
  img?: AssetMap['img']
  init: Promise<void>
  looper: Looper
  now: UTCMillis
  p1?: Player
  renderer: Renderer
  rnd?: Random
  seed?: PostSeed
  zoo: Zoo

  #fulfil!: () => void

  constructor() {
    const canvas = document.querySelector('canvas')
    if (!canvas) throw Error('no canvas')
    this.canvas = canvas

    this.cam = new Cam()
    this.cam.minWH = {w: minCanvasWH.w, h: minCanvasWH.h}
    this.ctrl = new Input(this.cam, canvas)
    this.ctrl.mapDefault()
    this.ac = new AudioContext()
    this.atlas = atlas as Atlas<Tag>
    this.bmps = new BitmapAttribBuffer(100)
    this.connected = false
    this.debug = devMode
    this.devPeerChan = devMode ? new BroadcastChannel('dev') : undefined
    this.eid = new EIDFactory()
    this.init = new Promise(fulfil => (this.#fulfil = fulfil))
    this.now = 0 as UTCMillis
    this.renderer = new Renderer(canvas)
    this.zoo = new Zoo()
    this.looper = new Looper(canvas, this.cam, this.ctrl, this.renderer)
    this.renderer.clearColor(paletteDark)
  }

  async start(): Promise<void> {
    addEventListener('message', this.#onMsg)
    this.#postMessage({type: 'Registered'})
    this.ctrl.register('add')
    this.looper.register('add')

    if (devMode) this.#initDevMode()

    this.looper.onPause = this.#onPause
    this.looper.onResize = this.#onResize
    this.looper.onResume = this.#onResume
    this.looper.render(this.cam, this.bmps, this.#onLoop)

    const lvl = new FieldLevel(this)
    await lvl.init(this)
  }

  stop(): void {
    removeEventListener('message', this.#onMsg)
    this.looper.cancel()
    this.looper.register('remove')
    this.ctrl.register('remove')
  }

  #onDevMsg(msg: Readonly<DevvitMessage>): void {
    this.#onMsg(
      new MessageEvent<DevvitSystemMessage>('message', {
        data: {type: 'devvit-message', data: {message: msg}},
      }),
    )
  }

  #initDevMode(): void {
    this.devPeerChan?.addEventListener('message', ev => {
      if (!ev.isTrusted) return
      this.#onDevMsg(ev.data)
    })
    const seedStr = new URL(location.href).searchParams.get('seed')
    const seed = seedStr ? Number.parseInt(seedStr) : Date.now()
    console.log(`seed=${seed}`)

    const p1 = {
      // Get an unseeded random profile for distinct multiplayer testing.
      profile: devProfiles[Math.trunc(Math.random() * devProfiles.length)]!,
      sid: SID(),
    }

    // Reuse the dev seed here. A new Random will be made at Init that repeats
    // this sequence but it doesn't matter.
    const rnd = new Random(seed as Seed)

    const connected = rnd.num() < 0.1

    setTimeout(
      () => {
        this.#onDevMsg({
          connected,
          debug: true,
          p1,
          seed: {seed: seed as Seed},
          type: 'Init',
        })
        if (!connected)
          setTimeout(
            () => this.#onDevMsg({type: 'Connected'}),
            Math.trunc(rnd.num() * 1000),
          )
      },
      Math.trunc(rnd.num() * 1000),
    )
  }

  #onLoop = (): void => {
    this.bmps.size = 0
    if (this.ctrl.gestured && this.ac.state !== 'running') void this.ac.resume() // Don't await; this can hang.

    this.now = utcMillisNow()

    this.zoo.update(this)
    this.zoo.draw(this)

    this.looper.render(this.cam, this.bmps, this.#onLoop)
  }

  #onMsg = (ev: MessageEvent<DevvitSystemMessage>): void => {
    // Filter any unknown messages.
    if (ev.isTrusted === devMode || ev.data.type !== 'devvit-message') return

    const msg = ev.data.data.message
    // if (this.debug || (msg.type === 'Init' && msg.debug))
    //   console.log(`Devvit → iframe msg=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'Init': {
        const init: InitGame = {
          connected: msg.connected,
          debug: msg.debug,
          p1: msg.p1,
          rnd: new Random(msg.seed.seed),
          seed: msg.seed,
        }
        this.connected = init.connected
        this.debug = init.debug
        this.p1 = init.p1
        this.rnd = init.rnd
        this.seed = init.seed
        if (this.debug) console.log('init')
        this.#fulfil()
        break
      }
      case 'Cell':
        // to-do: implement.
        break
      case 'Connected':
        if (this.debug) console.log('connected')
        break
      case 'Disconnected':
        if (this.debug) console.log('disconnected')
        break
      case 'Field':
        // to-do: implement.
        break
      default:
        msg satisfies never
    }
  }

  #onPause = (): void => {
    console.log('paused')
  }

  #onResize = (): void => {}

  #onResume = (): void => {
    console.log('resumed')
  }

  #postMessage(msg: Readonly<IframeMessage>): void {
    // to-do: peer messages: game.devPeerChan?.postMessage(msg)
    parent.postMessage(msg, document.referrer || '*')
  }
}
