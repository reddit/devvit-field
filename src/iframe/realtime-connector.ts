import {partitionConnectionUpdateInterval} from '../shared/theme.ts'
import {Throttle} from '../shared/throttle.ts'
import {type Box, type XY, xyEq} from '../shared/types/2d.ts'
import type {FieldConfig} from '../shared/types/field-config.ts'
import type {Game} from './game/game.ts'

export class RealtimeConnector {
  #start: XY = {x: 0, y: 0}
  #end: XY = {x: 0, y: 0}
  #parts?: XY[]
  #postMessage = new Throttle(
    (game: Game) =>
      game.postMessage({type: 'ConnectPartitions', parts: this.#parts ?? []}),
    partitionConnectionUpdateInterval,
  )

  update(game: Game): void {
    if ((this.#parts && game.cam.valid) || !game.fieldConfig) return

    const [start, end] = newStartEnd(game.cam, game.fieldConfig)

    if (xyEq(this.#start, start) && xyEq(this.#end, end)) return

    this.#start = start
    this.#end = end
    this.#parts = [...newParts(start, end, game.fieldConfig.partSize)]

    this.#postMessage.schedule(game)
  }
}

function* newParts(
  start: Readonly<XY>,
  end: Readonly<XY>,
  partSize: number,
): Generator<XY> {
  for (let y = start.y; y < end.y; y += partSize)
    for (let x = start.x; x < end.x; x += partSize) yield {x, y}
}

export function newStartEnd(
  cam: Readonly<Box & {fieldScale: number}>,
  config: Readonly<FieldConfig>,
): [XY, XY] {
  const start = {
    x: Math.max(0, Math.floor(cam.x / cam.fieldScale)),
    y: Math.max(0, Math.floor(cam.y / cam.fieldScale)),
  }
  const end = {
    x: Math.max(
      0,
      Math.min(config.wh.w, Math.floor((cam.x + cam.w) / cam.fieldScale)),
    ),
    y: Math.max(
      0,
      Math.min(config.wh.h, Math.floor((cam.y + cam.h) / cam.fieldScale)),
    ),
  }
  return [start, end]
}
