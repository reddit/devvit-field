import {type Team, teamPascalCase} from '../../shared/team.js'
import type {XY} from '../../shared/types/2d.js'
import {type Level, levelWord} from '../../shared/types/level.js'
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
  readonly #seq: (Tag | 'Die')[] = []
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

  resolve(ban: boolean, team: Team, lvl: Level): void {
    const pascalTeam = teamPascalCase[team]
    const pascalLvl = levelWord[lvl]
    // to-do: PascalCase basename in script.
    this.#seq.push(
      `box--${pascalTeam}Grow`,
      ban ? `box--BanFill${pascalLvl}` : `box--${pascalTeam}Fill`,
      'Die',
    )
  }

  update(game: Game): void {
    const {cam} = game

    if (this.#seq.length && this.#sprite.isLooped(game)) {
      const next = this.#seq.shift()!
      if (next === 'Die') {
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
