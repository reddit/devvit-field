import {devMode} from '../../shared/dev-mode.ts'
import {minCanvasWH} from '../../shared/theme.ts'
import type {
  DevvitMessage,
  DevvitSystemMessage,
} from '../../shared/types/message.ts'
import {Random, type Seed} from '../../shared/types/random.ts'
import {SID} from '../../shared/types/sid.ts'
import {type UTCMillis, utcMillisNow} from '../../shared/types/time.ts'
import {Cam, camNativeWH, camScale} from '../cam.ts'
import {devProfiles} from '../dev-profiles.ts'
import {EIDFactory} from '../ents/eid.ts'
import {LoadingLevel} from '../ents/levels/loading-level.ts'
import {Zoo} from '../ents/zoo.ts'
import {Input} from '../input/input.ts'
import {postIframeMessage} from '../utils/mail.ts'
import type {InitGame, PreloadGame} from './game.ts'
import {Looper} from './looper.ts'

export class Engine {
  #fulfil!: () => void
  #game: PreloadGame

  constructor() {
    const canvas = document.querySelector('canvas')
    if (!canvas) throw Error('no canvas')

    const cam = new Cam()
    cam.minWH = {w: minCanvasWH.w, h: minCanvasWH.h}
    const ctrl = new Input(cam, canvas)
    ctrl.mapDefault()
    const eid = new EIDFactory()
    const zoo = new Zoo()
    this.#game = {
      ac: new AudioContext(),
      cam,
      canvas,
      connected: false,
      ctrl,
      debug: devMode,
      devPeerChan: devMode ? new BroadcastChannel('dev') : undefined,
      eid,
      init: new Promise(fulfil => (this.#fulfil = fulfil)),
      looper: new Looper(canvas, cam, ctrl),
      now: 0 as UTCMillis,
      zoo,
    }
  }

  async start(): Promise<void> {
    addEventListener('message', this.#onMsg)
    postIframeMessage(this.#game, {type: 'Registered'})
    this.#game.ctrl.register('add')

    if (devMode) this.#initDevMode()

    this.#game.looper.onPause = this.#onPause
    this.#game.looper.onResize = this.#onResize
    this.#game.looper.onResume = this.#onResume
    this.#game.looper.loop = this.#onLoop

    const lvl = new LoadingLevel(this.#game)
    await lvl.init(this.#game)
  }

  #onDevMsg(msg: Readonly<DevvitMessage>): void {
    this.#onMsg(
      new MessageEvent<DevvitSystemMessage>('message', {
        data: {type: 'devvit-message', data: {message: msg}},
      }),
    )
  }

  #initDevMode(): void {
    this.#game.devPeerChan?.addEventListener('message', ev =>
      this.#onDevMsg(ev.data),
    )
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
    this.#game.looper.loop = this.#onLoop

    if (this.#game.ctrl.gestured && this.#game.ac.state !== 'running')
      void this.#game.ac.resume() // Don't await; this can hang.

    this.#game.c2d = this.#game.looper.c2d
    this.#game.textures = this.#game.looper.textures
    this.#game.now = utcMillisNow()

    this.#game.zoo.update(this.#game)
    this.#game.zoo.draw(this.#game)
  }

  #onMsg = (ev: MessageEvent<DevvitSystemMessage>): void => {
    // Filter any unknown messages.
    if (ev.data.type !== 'devvit-message') return

    const msg = ev.data.data.message
    if (this.#game.debug || (msg.type === 'Init' && msg.debug))
      console.log(`Devvit → iframe msg=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'Init': {
        const init: InitGame = {
          connected: msg.connected,
          debug: msg.debug,
          p1: msg.p1,
          rnd: new Random(msg.seed.seed),
          seed: msg.seed,
        }
        this.#game.connected = init.connected
        this.#game.debug = init.debug
        this.#game.p1 = init.p1
        this.#game.rnd = init.rnd
        this.#game.seed = init.seed
        if (this.#game.debug) console.log('init')
        this.#fulfil()
        break
      }
      case 'Cell':
        // to-do: implement.
        break
      case 'Connected':
        if (this.#game.debug) console.log('connected')
        break
      case 'Disconnected':
        if (this.#game.debug) console.log('disconnected')
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

  #onResize = (): void => {
    const {cam} = this.#game

    cam.minWH = camNativeWH()

    // don't truncate xy to avoid sawtooth movement.
    // cam.x = p1.x - Math.trunc(canvas.width / 2)
    // cam.y = p1.y - Math.trunc(canvas.height / 2)

    cam.x =
      -cam.w / 2 + (minCanvasWH.w * camScale(minCanvasWH, 1, 0, false)) / 2
    cam.y =
      -cam.h / 2 + (minCanvasWH.h * camScale(minCanvasWH, 1, 0, false)) / 2
  }

  #onResume = (): void => {
    console.log('resume')
  }
}
