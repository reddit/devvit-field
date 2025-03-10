import {type Team, teamPascalCase} from '../../shared/team.js'
import type {XY} from '../../shared/types/2d.js'
import {type Level, levelWord} from '../../shared/types/level.js'
import {audioPlay} from '../audio.js'
import type {Tag} from '../game/config.js'
import type {Game} from '../game/game.js'
import {Layer} from '../graphics/layer.js'
import {Sprite} from '../graphics/sprite.js'
import type {EID} from './eid.js'
import type {Ent} from './ent.js'

// to-do: extract sequence to animation.

export class BoxEnt implements Ent {
  readonly eid: EID
  readonly fieldXY: Readonly<XY>
  readonly #seq: (Tag | 'Banned' | 'Claimed' | 'Lost')[] = []
  readonly #sprite: Sprite<Tag>

  constructor(game: Game, fieldXY: Readonly<XY>) {
    this.eid = game.eid.new()
    if (game.team == null) throw Error('no team')
    this.fieldXY = fieldXY
    const team = teamPascalCase[game.team]
    this.#sprite = new Sprite(game.atlas, `box--${team}Pending`)
    this.#sprite.z = Layer.UIFore
    this.#sprite.stretch = true
    this.#sprite.cel = game.looper.frame / 4
  }

  draw(game: Readonly<Game>): void {
    game.bmps.push(this.#sprite)
  }

  resolve(
    game: Game,
    ban: boolean,
    team: Team,
    lvl: Level,
    isFromP1: boolean,
  ): void {
    const pascalTeam = teamPascalCase[team]
    const pascalLvl = levelWord[lvl]
    // to-do: PascalCase basename in script.
    this.#seq.push(
      `box--${pascalTeam}Grow`,
      ban ? `box--BanFill${pascalLvl}` : `box--${pascalTeam}Fill`,
      ban && isFromP1 ? 'Banned' : game.team === team ? 'Claimed' : 'Lost',
    )
  }

  update(game: Game): void {
    const {cam} = game

    if (this.#seq.length && this.#sprite.isLooped(game)) {
      const next = this.#seq.shift()!
      if (next === 'Banned' || next === 'Claimed' || next === 'Lost') {
        if (game.audio && next === 'Claimed')
          audioPlay(game, game.audio.claimed)
        if (next === 'Banned') vibrateBan()

        game.zoo.remove(this)
        return
      }
      this.#sprite.tag = next
      this.#sprite.cel = game.looper.frame / 4
    }

    this.#sprite.x = (-cam.x + this.fieldXY.x) * cam.scale * cam.fieldScale
    this.#sprite.y = (-cam.y + this.fieldXY.y) * cam.scale * cam.fieldScale
    this.#sprite.w = this.#sprite.h = cam.fieldScale
  }
}

function vibrateBan(): void {
  const dot = 50
  const dash = 3 * dot
  const intraGap = dot // Gap within a letter.
  const gap = 3 * dot // Gap between letters.
  // biome-ignore format:
  const ban = [
    // B (−···).
    dash, intraGap, dot, intraGap, dot, intraGap, dot, gap,

    // A (·−).
    dot, intraGap, dash, gap,

    // N (−·).
    dash, intraGap, dot, gap
  ]
  navigator.vibrate?.(ban)
}
