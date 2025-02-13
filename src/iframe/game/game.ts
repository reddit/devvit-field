import type {Player} from '../../shared/save.ts'
import {cssHex, minCanvasWH, paletteBlack} from '../../shared/theme.ts'
import type {FieldConfig} from '../../shared/types/field-config.ts'
import type {
  DevvitMessage,
  DevvitSystemMessage,
  IframeMessage,
  IframeMode,
} from '../../shared/types/message.ts'
import {Random, type Seed} from '../../shared/types/random.ts'
import {SID} from '../../shared/types/sid.ts'
import {type UTCMillis, utcMillisNow} from '../../shared/types/time.ts'
import {AssetMap} from '../asset-map.ts'
import {Audio, type AudioBufferByName} from '../audio.ts'
import {devProfiles} from '../dev-profiles.ts'
import {EIDFactory} from '../ents/eid.ts'
import {WelcomeLevel} from '../ents/levels/welcome-level.ts'
import {Zoo} from '../ents/zoo.ts'
import type {Atlas} from '../graphics/atlas.ts'
import {type DefaultButton, Input} from '../input/input.ts'
import {BmpAttribBuffer} from '../renderer/attrib-buffer.ts'
import {Cam} from '../renderer/cam.ts'
import {Renderer} from '../renderer/renderer.ts'
import atlas from './atlas.json' with {type: 'json'}
import type {Tag} from './config.ts'
import {Looper} from './looper.ts'

// to-do: SavableGame for LocalStorage savable state.

/**
 * Loading sequence is:
 * - Devvit <Preview>.
 * - Devvit <webview> (initially transparent).
 * - index.html is loaded; JavaScript and asset fetches are queued. HTML and CSS
 *   can show whatever is wanted.
 * - JavaScript is loaded; Game.start() started. Still showing HTML and CSS.
 * - Game.start() finished including InitDevvitMessage. Game is ready.
 */

// to-do: make these vars private to prevent cheating.
export class Game {
  // to-do: encapsulate and review need for pre vs postload state given load screen is in HTML.
  ac: AudioContext
  atlas: Atlas<Tag>
  audio?: AudioBufferByName
  bmps: BmpAttribBuffer
  cam: Cam
  canvas: HTMLCanvasElement
  connected: boolean
  ctrl: Input<DefaultButton>
  debug: boolean
  devPeerChan: BroadcastChannel | undefined
  eid: EIDFactory
  field: Uint8Array
  fieldConfig: Readonly<FieldConfig> | undefined
  fieldScale: number = 30
  img?: AssetMap['img']
  init: Promise<void>
  looper: Looper
  mode?: IframeMode
  now: UTCMillis
  p1?: Player
  renderer: Renderer
  rnd?: Random
  seed?: Seed
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
    this.bmps = new BmpAttribBuffer(100)
    this.connected = false
    this.debug = devMode
    this.devPeerChan = devMode ? new BroadcastChannel('dev') : undefined
    this.eid = new EIDFactory()
    this.field = new Uint8Array()
    this.init = new Promise(fulfil => (this.#fulfil = fulfil))
    this.now = 0 as UTCMillis
    this.renderer = new Renderer(canvas)
    this.zoo = new Zoo()
    this.looper = new Looper(canvas, this.cam, this.ctrl, this.renderer)
    this.renderer.clearColor(paletteBlack)
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
    this.#onLoop()

    const lvl = new WelcomeLevel(this)

    const assets = await AssetMap()

    this.audio = await Audio(assets)
    this.img = assets.img

    await this.init
    this.renderer.load(
      this.atlas,
      assets.img.atlas,
      this.field,
      this.fieldConfig,
    )

    lvl.init(this)

    document.body.style.background = cssHex(paletteBlack)
    // Transition from invisible. No line height spacing.
    this.canvas.style.display = 'block'

    this.#postMessage({type: 'Loaded'})
    console.log('loaded')
  }

  stop(): void {
    removeEventListener('message', this.#onMsg)
    this.looper.cancel()
    this.looper.register('remove')
    this.ctrl.register('remove')
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

    setTimeout(
      () => {
        this.#onDevMsg({
          connected: true,
          debug: true,
          field: {wh: {w: 3333, h: 3333}},
          mode: rnd.num() < 0.5 ? 'PopIn' : 'PopOut',
          p1,
          seed: seed as Seed,
          type: 'Init',
        })
      },
      Math.trunc(rnd.num() * 1000),
    )
    if (rnd.num() < 0.1)
      setTimeout(
        () => this.#onDevMsg({type: 'Connected'}),
        Math.trunc(rnd.num() * 1000),
      )
  }

  #onDevMsg(msg: Readonly<DevvitMessage>): void {
    this.#onMsg(
      new MessageEvent<DevvitSystemMessage>('message', {
        data: {type: 'devvit-message', data: {message: msg}},
      }),
    )
  }

  #onConnect(): void {
    if (this.debug) console.log('connected')
    this.connected = true
  }

  #onDisconnect(): void {
    if (this.debug) console.log('disconnected')
    this.connected = false
  }

  #onLoop = (): void => {
    if (this.ctrl.isOnStart('A') && this.mode === 'PopIn')
      this.#postMessage({type: 'PopOut'})

    this.bmps.size = 0
    // Don't await; this can hang.
    if (this.ctrl.gestured && this.ac.state !== 'running') void this.ac.resume()

    this.now = utcMillisNow()

    this.zoo.update(this)
    this.zoo.draw(this)

    this.looper.render(this.cam, this.bmps, this.#onLoop, this.fieldScale)
  }

  #onMsg = (ev: MessageEvent<DevvitSystemMessage>): void => {
    // Filter any unknown messages.
    if (ev.isTrusted === devMode || ev.data.type !== 'devvit-message') return

    const msg = ev.data.data.message
    // if (this.debug || (msg.type === 'Init' && msg.debug))
    //   console.log(`Devvit → iframe msg=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'Init': {
        this.debug = msg.debug
        this.seed = msg.seed ?? (0 as Seed)
        this.rnd = new Random(this.seed)
        this.field = new Uint8Array(msg.field.wh.w * msg.field.wh.h)

        // to-do: delete random nonsense.
        // to-do: if (devMode)

        for (let y = 0; y < msg.field.wh.h; y++)
          for (let x = 0; x < msg.field.wh.w; x++)
            if (this.rnd.num() < 0.2)
              this.field[y * msg.field.wh.w + x] = Math.trunc(
                this.rnd.num() * 6,
              )

        for (let y = 0; y < msg.field.wh.h; y++) {
          this.field[y * msg.field.wh.w] = Math.trunc(this.rnd.num() * 6)
          this.field[y * msg.field.wh.w + msg.field.wh.w - 1] = Math.trunc(
            this.rnd.num() * 6,
          )
        }
        for (let y = 0; y < msg.field.wh.h; y++)
          for (let x = 0; x < msg.field.wh.w; x++) {
            this.field[x] = Math.trunc(this.rnd.num() * 6)
            this.field[(msg.field.wh.h - 1) * msg.field.wh.w + x] = Math.trunc(
              this.rnd.num() * 6,
            )
          }

        this.fieldConfig = msg.field
        this.p1 = msg.p1
        this.mode = msg.mode
        if (this.debug) console.log('init')
        this.#fulfil()
        // Init this.connected.
        if (this.connected !== msg.connected) {
          if (msg.connected) this.#onConnect()
          else this.#onDisconnect()
        }
        break
      }
      case 'Cell':
        // to-do: implement.
        if (!this.p1) return
        break
      case 'Connected':
        if (!this.p1) return
        this.#onConnect()
        break
      case 'Disconnected':
        if (!this.p1) return
        this.#onDisconnect()
        break
      case 'Field':
        if (!this.p1) return
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
