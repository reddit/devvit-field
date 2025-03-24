import {getPartitionCoords} from '../../shared/partition.ts'
import type {Player} from '../../shared/save.ts'
import type {Team} from '../../shared/team.ts'
import {cssHex, paletteBlack} from '../../shared/theme.ts'
import {type XY, xyEq} from '../../shared/types/2d.ts'
import {
  type AppConfig,
  getDefaultAppConfig,
} from '../../shared/types/app-config.ts'
import type {FieldConfig} from '../../shared/types/field-config.ts'
import {
  type Level,
  type LevelPascalCase,
  levelPascalCase,
} from '../../shared/types/level.ts'
import type {
  DevvitMessage,
  DevvitSystemMessage,
  IframeMessage,
  TeamBoxCounts,
} from '../../shared/types/message.ts'
import {Random, type Seed} from '../../shared/types/random.ts'
import {SID} from '../../shared/types/sid.ts'
import {type T5, noT5} from '../../shared/types/tid.ts'
import {type UTCMillis, utcMillisNow} from '../../shared/types/time.ts'
import {AssetMap} from '../asset-map.ts'
import {Audio, type AudioBufferByName, audioPlay} from '../audio.ts'
import {devProfiles} from '../dev-profiles.ts'
import type {BFGame} from '../elements/bf-game.ts'
import {Bubble} from '../elements/bubble.ts'
import {BoxEnt} from '../ents/box-ent.ts'
import {EIDFactory} from '../ents/eid.ts'
import {FieldLevel} from '../ents/levels/field-level.ts'
import {Zoo} from '../ents/zoo.ts'
import type {Atlas} from '../graphics/atlas.ts'
import {type DefaultButton, Input} from '../input/input.ts'
import {
  PartDataFetcher,
  type RenderPatch,
  type RenderReplace,
} from '../part-data/part-data-fetcher.ts'
import {BmpAttribBuffer} from '../renderer/attrib-buffer.ts'
import {Cam} from '../renderer/cam.ts'
import {
  fieldArrayColorBan,
  fieldArrayColorHidden,
  fieldArrayColorLoading,
  fieldArrayIndex,
  fieldArrayIsVisible,
  fieldArraySetTeam,
} from '../renderer/field-array.ts'
import {Renderer} from '../renderer/renderer.ts'
import {mapSize} from '../ui.ts'
import {staggerMap} from '../utils/stagger.ts'
import atlas from './atlas.json' with {type: 'json'}
import type {Tag} from './config.ts'
import {Looper} from './looper.ts'

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
  // to-do: SavableGame for LocalStorage savable state.
  // to-do: encapsulate and review need for pre vs postload state given load screen is in HTML.
  ac: AudioContext
  appConfig: AppConfig = getDefaultAppConfig()
  assets: AssetMap | undefined
  atlas: Atlas<Tag>
  audio?: AudioBufferByName
  bannedPlayers: number = 0
  bmps: BmpAttribBuffer
  cam: Cam
  canvas!: HTMLCanvasElement
  /** The match number. */
  challenge: number | undefined
  /** Most recent claim timestamp. */
  claimed: UTCMillis = 0 as UTCMillis
  connected: boolean
  ctrl!: Input<DefaultButton>
  debug: boolean
  devPeerChan: BroadcastChannel | undefined
  eid: EIDFactory
  field: Uint8Array
  fieldConfig: Readonly<FieldConfig> | undefined
  img?: AssetMap['img']
  init: Promise<void>
  looper!: Looper
  lvl: FieldLevel
  map: Uint8Array
  now: UTCMillis
  p1?: Player
  p1BoxCount: number = 0
  partDataFetcher: PartDataFetcher
  /** Number of players online including p1; 0 when offline. */
  players: number
  renderer!: Renderer
  seed?: Seed
  // to-do: providing the previous pointer position in Input would be handy.
  select: XY
  /**
   * The subreddit name without an r/ prefix. Eg, BananaField. The field level
   * when not in a dev sub.
   */
  sub?: LevelPascalCase | string
  subLvl?: Level
  t5: T5 = noT5
  team: Team | undefined
  teamBoxCounts: TeamBoxCounts | undefined
  ui: BFGame
  /** Number of boxes in the field visible; [0, field size]. */
  visible: number | undefined
  zoo: Zoo

  readonly #pending: BoxEnt[] = []

  #fulfil!: () => void

  constructor(ui: BFGame) {
    this.ac = new AudioContext()
    this.atlas = atlas as Atlas<Tag>
    this.bmps = new BmpAttribBuffer(1000)
    this.cam = new Cam()
    this.connected = false
    this.debug = devMode
    this.devPeerChan = devMode ? new BroadcastChannel('dev') : undefined
    this.eid = new EIDFactory()
    this.field = new Uint8Array()
    this.partDataFetcher = new PartDataFetcher(
      this.cam,
      this.#renderPatch,
      this.#renderReplace,
    )
    this.init = new Promise(fulfil => (this.#fulfil = fulfil))
    this.lvl = new FieldLevel(this)
    this.map = new Uint8Array()
    this.now = 0 as UTCMillis
    this.players = 0
    this.select = {x: 0, y: 0}
    this.ui = ui
    this.zoo = new Zoo()
  }

  centerBox(xy: Readonly<XY>): void {
    const x = Math.floor(
      xy.x - this.cam.w / this.cam.scale / this.cam.fieldScale / 2 + 0.5,
    )
    const y = Math.floor(
      xy.y - this.cam.h / this.cam.scale / this.cam.fieldScale / 2 + 0.5,
    )
    this.moveTo({x, y})
  }

  claimBox(xy: Readonly<XY>): void {
    if (!this.audio || !this.fieldConfig) return
    audioPlay(this, this.audio.claim, 0, 'Queue')
    if (this.isCooldown() || !this.isClaimable(xy)) return
    // Delay until claim sound completes.
    // to-do: this is overlapping with claimed.
    // audioPlay(this.ac, this.audio.cool, 600)
    this.claimed = this.now
    this.postMessage({type: 'ClaimBoxes', boxes: [xy]})
    this.canvas.dispatchEvent(Bubble('game-update', undefined))
    setTimeout(
      () => this.canvas.dispatchEvent(Bubble('game-update', undefined)),
      // Hack: ensure this.now >= cooldownMillis.
      this.appConfig.globalClickCooldownMillis + 100,
    )

    const box = new BoxEnt(this, xy)
    this.#pending.push(box)
    this.zoo.add(box)
  }

  isClaimable(xy: Readonly<XY>): boolean {
    if (!this.fieldConfig) return false
    const i = fieldArrayIndex(this.fieldConfig, xy)
    return !this.#findPending(xy) && !fieldArrayIsVisible(this.field, i)
  }

  isCooldown(): boolean {
    return this.now - this.claimed < this.appConfig.globalClickCooldownMillis
  }

  moveTo(xy: Readonly<XY>): void {
    if (!this.fieldConfig) return
    this.cam.x =
      Math.max(
        -this.cam.w / 2 / this.cam.scale / this.cam.fieldScale,
        Math.min(
          xy.x,
          this.fieldConfig.wh.w -
            this.cam.w / 2 / this.cam.scale / this.cam.fieldScale,
        ),
      ) || 0
    this.cam.y =
      Math.max(
        -this.cam.h / 2 / this.cam.scale / this.cam.fieldScale,
        Math.min(
          xy.y,
          this.fieldConfig.wh.h -
            this.cam.h / 2 / this.cam.scale / this.cam.fieldScale,
        ),
      ) || 0
  }

  selectBox(xy: Readonly<XY>): void {
    if (!this.fieldConfig) return
    // to-do: move this mutation to a centralized store so it's easier to see
    // //     how state changes.
    this.select.x = xy.x
    this.select.y = xy.y
    this.canvas.dispatchEvent(Bubble('game-update', undefined))
  }

  async start(): Promise<void> {
    // The native apps do not support messages before load. Await in parallel
    // with assets.
    const [, assets] = await Promise.all([
      new Promise(resolve => addEventListener('load', resolve)),
      AssetMap(),
      // Wait for canvas.
      this.ui.updateComplete,
    ])
    this.assets = assets

    this.canvas = await this.ui.canvas()
    this.ctrl = new Input(this.cam, this.canvas)
    this.ctrl.mapDefault()

    this.renderer = new Renderer(this.canvas)
    this.looper = new Looper(this.canvas, this.cam, this.ctrl, this.renderer)

    addEventListener('message', this.#onMessageEvent)
    this.postMessage({type: 'Registered'})
    this.ctrl.register('add')
    this.looper.register('add')

    this.#initDevMode()

    this.renderer.clearColor(paletteBlack)

    this.looper.onPause = this.#onPause
    this.looper.onResize = this.#onResize
    this.looper.onResume = this.#onResume
    this.#onLoop()

    this.audio = await Audio(assets)
    this.img = assets.img

    await this.init
    this.renderer.load(
      this.atlas,
      assets.img.atlas,
      this.field,
      this.fieldConfig,
      this.map,
      this.subLvl,
    )

    this.lvl.init(this)

    this.partDataFetcher.resume()

    document.body.style.background = cssHex(paletteBlack)
    // Transition from invisible. No line height spacing.
    this.canvas.style.display = 'block'

    // to-do: do everything with dispatch or everything with direct interactions
    //        since a reference to BFGame is had.
    if (this.ui.ui === 'Loading') this.ui.ui = 'Playing'

    this.postMessage({type: 'Loaded'})
    console.log('loaded')
  }

  stop(): void {
    this.partDataFetcher.pause()
    removeEventListener('message', this.#onMessageEvent)
    this.looper?.cancel()
    this.looper?.register('remove')
    this.ctrl?.register('remove')
  }

  #clearLoadingForPart(partXY: Readonly<XY>): void {
    if (!this.fieldConfig) return
    const partSize = this.fieldConfig.partSize

    const xy = {x: partXY.x * partSize, y: partXY.y * partSize}

    const partLoading =
      this.field[fieldArrayIndex(this.fieldConfig, xy)] ===
      fieldArrayColorLoading
    if (!partLoading) return

    for (let y = 0; y < partSize; y++) {
      const start =
        (partXY.y * partSize + y) * this.fieldConfig.wh.w + partXY.x * partSize
      this.field.fill(fieldArrayColorHidden, start, start + partSize)
    }
  }

  #findPending(xy: Readonly<XY>): BoxEnt | undefined {
    return this.#pending.find(box => xyEq(box.fieldXY, xy))
  }

  #initDevMode(): void {
    if (!devMode) return

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
    // Hack: add extra devMode check. https://github.com/evanw/esbuild/issues/4083
    const rnd = devMode
      ? new Random(seed as Seed)
      : {
          get num() {
            return Math.random()
          },
        }

    const lvl = Math.trunc(rnd.num * 5) as Level
    const partSize = 1 + Math.trunc(rnd.num * 800)
    const size = partSize * 4
    // to-do: randomize bans.
    const field = {bans: 0, partSize, wh: {w: size, h: size}}
    const team = Math.trunc(rnd.num * 4) as Team
    const visible = Math.trunc(rnd.num * field.wh.w * field.wh.h)
    const teamBoxCounts: TeamBoxCounts = [0, 0, 0, 0]
    let counted = 0
    for (const team in teamBoxCounts) {
      teamBoxCounts[team] = Math.trunc(rnd.num * (visible - counted + 1))
      counted += teamBoxCounts[team]
    }
    teamBoxCounts[teamBoxCounts.length - 1]! += visible - counted

    setTimeout(
      () => {
        this.#onDevMsg({
          appConfig: getDefaultAppConfig(),
          bannedPlayers: Math.trunc(rnd.num * 5_000_000),
          challenge: Math.trunc(rnd.num * 10_000),
          connected: true,
          debug: true,
          field,
          lvl,
          p1,
          p1BoxCount: Math.trunc(Math.random() * (visible + 1)),
          players: Math.trunc(rnd.num * 99_999_999),
          seed: seed as Seed,
          sub: levelPascalCase[lvl],
          t5: noT5,
          team,
          teamBoxCounts,
          type: 'Init',
          visible,
          initialGlobalXY: {x: 0, y: 0},
        })
      },
      Math.trunc(rnd.num * 1000),
    )
    if (rnd.num < 0.1)
      setTimeout(
        () => this.#onDevMsg({type: 'Connected'}),
        Math.trunc(rnd.num * 1000),
      )
  }

  #invalidatePart(partXY: Readonly<XY>): void {
    if (!this.fieldConfig) return

    const partSize = this.fieldConfig.partSize

    this.renderer.setBox(
      {
        x: partXY.x * partSize,
        y: partXY.y * partSize,
        w: partSize,
        h: partSize,
      },
      this.fieldConfig.wh.w,
      this.field,
    )
  }

  #onConnect(): void {
    if (this.debug) console.log('connected')
    this.connected = true
    // to-do: show connection status somewhere.
  }

  #onDevMsg(msg: Readonly<DevvitMessage>): void {
    this.#onMessageEvent(
      new MessageEvent<DevvitSystemMessage>('message', {
        data: {type: 'devvit-message', data: {message: msg}},
      }),
    )
  }

  #onDisconnect(): void {
    if (this.debug) console.log('disconnected')
    this.connected = false
  }

  #onLoop = (): void => {
    const parent = this.canvas.parentElement!
    this.cam.minWH.w = parent.clientWidth * devicePixelRatio
    this.cam.minWH.h = parent.clientHeight * devicePixelRatio

    // Suppress all input when pre-init.
    if (this.ui.ui !== 'Playing') this.ctrl.handled = true

    this.bmps.size = 0

    if (this.ctrl.gestured && this.ac.state !== 'running')
      void this.ac.resume().catch(console.warn) // Don't await; this can hang.

    this.now = utcMillisNow()

    this.zoo.update(this)
    this.zoo.draw(this)

    this.looper.render(
      this.bmps,
      this.fieldConfig ?? {bans: 0, partSize: 1, wh: {w: 1, h: 1}},
      this.#onLoop,
    )

    this.partDataFetcher.update()
  }

  #onMessageEvent = (ev: MessageEvent<DevvitSystemMessage>): void => {
    // Filter any unknown messages.
    if (ev.data.type !== 'devvit-message') return

    // Hack: events are untrusted on Android and iOS native apps.
    if (
      ev.isTrusted === devMode &&
      !/Android|iPad|iPhone|iPod/i.test(navigator.userAgent)
    )
      return

    this.#onMsg(ev.data.data.message)
    // if (this.debug || (msg.type === 'Init' && msg.debug))
    //   console.log(`Devvit → iframe msg=${JSON.stringify(msg)}`)
  }

  #onMsg = (msg: DevvitMessage): void => {
    switch (msg.type) {
      case 'Init': {
        this.appConfig = msg.appConfig
        this.bannedPlayers = msg.bannedPlayers
        this.challenge = msg.challenge
        this.debug = msg.debug
        this.map = new Uint8Array(mapSize * mapSize)
        this.p1BoxCount = msg.p1BoxCount
        this.players = msg.players
        this.seed = msg.seed ?? (0 as Seed)
        this.sub = msg.sub
        this.subLvl = msg.lvl
        this.t5 = msg.t5
        this.team = msg.team
        this.teamBoxCounts = msg.teamBoxCounts
        this.field = new Uint8Array(msg.field.wh.w * msg.field.wh.h)
        this.visible = msg.visible
        this.fieldConfig = msg.field

        if (msg.reinit) {
          console.log('reinit')
          this.ac = new AudioContext()
          this.partDataFetcher.deinit()
          this.#pending.length = 0
          if (!this.assets) throw Error('no assets')
          this.p1BoxCount = 0
          this.renderer.load(
            this.atlas,
            this.assets.img.atlas,
            this.field,
            this.fieldConfig,
            this.map,
            this.subLvl,
          )
          this.zoo.clear()
          this.lvl.init(this)
          this.canvas.dispatchEvent(
            Bubble('game-ui', {ui: 'Playing', msg: undefined}),
          )
        }
        this.partDataFetcher.setLiveConfig(this.appConfig)
        this.partDataFetcher.init(this.fieldConfig, msg.initialMapKey)

        if (devMode) {
          const rnd = new Random(this.seed)
          let visible = 0
          end: for (;;)
            for (let y = 0; y < msg.field.wh.h; y++)
              for (let x = 0; x < msg.field.wh.w; x++) {
                if (visible === this.visible) break end
                if (rnd.num < 0.2) {
                  visible++
                  const i = fieldArrayIndex(this.fieldConfig, {x, y})
                  if (rnd.num < 0.2) this.field[i] = fieldArrayColorBan
                  else
                    fieldArraySetTeam(
                      this.field,
                      i,
                      Math.trunc(rnd.num * 4) as Team,
                    )
                }
              }

          // for (let y = 0; y < mapSize; y++)
          //   for (let x = 0; x < mapSize; x++) {
          //     const i = fieldArrayIndex(
          //       {bans: 0, partSize: mapSize, wh: {w: mapSize, h: mapSize}},
          //       {x, y},
          //     )
          //     if (rnd.num < 0.8) continue
          //     if (rnd.num < 0.2) fieldArraySetBan(this.map, i)
          //     else
          //       fieldArraySetTeam(this.map, i, Math.trunc(rnd.num * 4) as Team)
          //   }
        }

        this.selectBox(msg.initialGlobalXY)
        this.centerBox(msg.initialGlobalXY)

        this.p1 = msg.p1
        if (this.debug) console.log('init')
        this.#fulfil()
        // Init this.connected.
        if (this.connected !== msg.connected) {
          if (msg.connected) this.#onConnect()
          else this.#onDisconnect()
        }
        this.canvas.dispatchEvent(Bubble('game-update', undefined))
        break
      }
      case 'Box': {
        if (!this.p1) return
        this.p1BoxCount += msg.claimedCells.length

        const cells = [...msg.claimedCells, ...msg.lostCells]

        if (!this.fieldConfig || !cells[0]) return

        for (const [i, cell] of cells.entries()) {
          const pend = this.#findPending(cell.globalXY)
          if (pend)
            pend.resolve(
              this,
              cell.isBan,
              cell.team,
              this.subLvl!,
              i < msg.claimedCells.length,
            )
        }
        const partXY = getPartitionCoords(
          cells[0].globalXY,
          this.fieldConfig.partSize,
        )
        this.#renderPatch(cells, partXY)

        break
      }
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
      case 'ChallengeComplete': {
        // we don't use this case here, challengeEnded conditions are handled by Dialog
        break
      }
      case 'Dialog':
        // Users want to see the ban box rendered before seeing the dialog
        if (msg.code === 'ClaimedABanBox') {
          setTimeout(() => {
            this.canvas.dispatchEvent(
              Bubble('game-ui', {ui: 'DialogMessage', msg}),
            )
          }, 1700)
        } else {
          this.canvas.dispatchEvent(
            Bubble('game-ui', {ui: 'DialogMessage', msg}),
          )
        }
        break
      case 'PartitionUpdate': {
        this.partDataFetcher.message(msg)
        break
      }
      case 'ConfigUpdate':
        this.appConfig = msg.config
        this.partDataFetcher.setLiveConfig(this.appConfig)
        console.log('live config updated', msg.config)
        break
      case 'SetTimeout':
        setTimeout(() => {
          this.postMessage(msg.message)
        }, msg.timeoutMillis)
        break
      case 'LeaderboardUpdate':
        this.teamBoxCounts = msg.teamBoxCounts
        this.bannedPlayers = msg.bannedPlayers
        this.players = msg.activePlayers
        this.canvas.dispatchEvent(Bubble('game-update', undefined))
        break
      case 'BatchMessage':
        for (const elem of msg.batch) {
          this.#onMsg(elem)
        }
        break
      default:
        msg satisfies never
    }
  }

  #onPause = (): void => {
    console.log('paused')
    void this.ac.suspend().catch(console.warn)
    this.partDataFetcher.pause()
  }

  #renderPatch: RenderPatch = (boxes, partXY) => {
    if (!this.fieldConfig) return

    this.#clearLoadingForPart(partXY) // Must be called for any partition write.

    staggerMap(boxes, 1_000, ({globalXY, isBan, team}) => {
      // console.log(
      //   `patch part=${partXY.x}-${partXY.y} xy=${globalXY.x}-${globalXY.y}`,
      // )
      if (!this.fieldConfig) return
      const i = fieldArrayIndex(this.fieldConfig, globalXY)
      if (isBan) this.field[i] = fieldArrayColorBan
      else fieldArraySetTeam(this.field, i, team)
      this.#invalidatePart(partXY)
    })
  }

  #renderReplace: RenderReplace = (buf, partXY) => {
    if (!this.fieldConfig) return

    this.#clearLoadingForPart(partXY) // Must be called for any partition write.

    const partSize = this.fieldConfig.partSize

    // The main thread must retain a copy of the array at all times in case
    // context is lost. It cannot be transferred in and out of PartitionWorker.
    // to-do: consider reworking shader to be SharedArrayBuffer compatible and
    //        using atomics to signal GPU transfers.

    // to-do: test if row is visible. If not, ust a fast copy. We can't blindly
    //        copy over since the partition may be a little older than the last
    //        delta written (usually containing player claims).
    // for (let y = 0; y < partSize; y++) {
    //   this.field.set(
    //     boxes.subarray(y * partSize, y * partSize + partSize),
    //     (partXY.y * partSize + y) * this.fieldConfig.wh.w + partXY.x * partSize,
    //   )
    // }

    const boxes = new Uint8Array(buf)
    for (let i = 0; i < boxes.length; i++)
      if (boxes[i] !== fieldArrayColorHidden) {
        const xy = {
          x: partXY.x * partSize + (i % partSize),
          y: partXY.y * partSize + Math.floor(i / partSize),
        }
        this.field[fieldArrayIndex(this.fieldConfig!, xy)] = boxes[i]!
      }

    this.#invalidatePart(partXY)
  }

  #onResize = (): void => {}

  #onResume = (): void => {
    console.log('resumed')
    this.partDataFetcher.resume()
  }

  postMessage(msg: Readonly<IframeMessage>): void {
    // to-do: peer messages: game.devPeerChan?.postMessage(msg)
    parent.postMessage(msg, document.referrer || '*')
  }
}
