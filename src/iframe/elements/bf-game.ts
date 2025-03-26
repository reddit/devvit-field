import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property, queryAsync} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import {teamPascalCase} from '../../shared/team.ts'
import {cssHex} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {DialogMessage} from '../../shared/types/message.ts'
import {Game} from '../game/game.ts'
import type {BFTerminal} from './bf-terminal.ts'
import {cssReset} from './css-reset.ts'

import './bf-dialog.ts'
import './bf-terminal.ts'
import './dialogs/dialog-ascended.ts'
import './dialogs/dialog-banned.ts'
import './dialogs/dialog-staying.ts'
import './dialogs/dialog-unauthorized.ts'
import './dialogs/dialog-webgl.ts'
import {
  levelBaseColor,
  levelHighlightColor,
  levelShadowColor,
} from '../../shared/types/level.ts'

declare global {
  interface HTMLElementEventMap {
    'game-debug': CustomEvent<string>
    'game-ui': CustomEvent<{
      ui: UI
      msg: DialogMessage | undefined
    }>
    /** Request update; Game properties have changed. */
    'game-update': CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-game': BFGame
  }
}

export type UI =
  | 'DialogMessage'
  /** User not using a device that supports WebGL 2 */
  | 'NoWebGL'
  | 'Loading'
  | 'Playing'

/**
 * Game canvas wrapper and DOM UI. Pass primitive properties to children so
 * that @game-update updates children.
 */
@customElement('bf-game')
export class BFGame extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: block;
      height: 100%;
    }

    pre {
      height: 100px;
      overflow: auto;
      background: #fff;
    }

    .box {
      display: flex;
      flex-direction: column;
      height: 100%;
    }`

  @property({reflect: true}) accessor ui: UI = 'Loading'
  @queryAsync('bf-terminal') accessor _terminal!: Promise<BFTerminal>

  #dbgLog: string = ''
  #game: Game = new Game(this)
  #msg: DialogMessage | undefined

  // to-do: pass to game.
  async canvas(): Promise<HTMLCanvasElement> {
    const terminal = await this._terminal
    return await terminal.canvas
  }

  override connectedCallback(): void {
    super.connectedCallback()
    void this.#game.start()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#game.stop()
  }

  protected override render(): TemplateResult {
    // const fieldSize = this.#game.fieldConfig
    //   ? this.#game.fieldConfig.wh.w * this.#game.fieldConfig.wh.h
    //   : 0
    // const visible =
    //   this.#game.fieldConfig && this.#game.visible != null
    //     ? this.#game.visible / fieldSize
    //     : undefined
    // const score =
    //   this.#game.team != null && this.#game.teamBoxCounts
    //     ? this.#game.teamBoxCounts[this.#game.team]
    //     : undefined
    const team =
      this.#game.team == null ? undefined : teamPascalCase[this.#game.team]

    let dialog

    const winningTeam =
      this.#msg?.code === 'ChallengeEndedAscend' ||
      this.#msg?.code === 'ChallengeEndedStay'
        ? this.#msg.standings[0]?.member
        : 0

    switch (this.ui) {
      case 'Loading':
        break
      case 'Playing':
        break
      case 'NoWebGL':
        dialog = html`<dialog-webgl></dialog-webgl>`
        break
      case 'DialogMessage': {
        if (this.#msg?.type !== 'Dialog') throw new Error('no dialog message')
        switch (this.#msg?.code) {
          case 'ClaimedABanBox':
            dialog = html`
              <dialog-banned
                subLvl=${ifDefined(this.#game.subLvl)}
                buttonLevel=${this.#msg.lvl}
                .buttonHandler=${() => {
                  this.#msg
                    ? this.#game.postMessage(this.#msg)
                    : console.log('no msg')
                }}
              >
            </dialog-banned>`
            break
          case 'ChallengeEndedAscend':
            dialog = html`
              <dialog-ascended
                subLvl=${ifDefined(this.#game.subLvl)}
                .buttonHandler=${() => {
                  this.#msg
                    ? this.#game.postMessage(this.#msg)
                    : console.log('no msg')
                }}
                .team=${winningTeam ? winningTeam : 0}
              >
            </dialog-ascended>`
            break
          case 'ChallengeEndedStay':
            dialog = html`
              <dialog-staying
                subLvl=${ifDefined(this.#game.subLvl)}
                roundNumber=${0}
                .team=${winningTeam ? winningTeam : 0}
                myPoints=${this.#msg.profile.lastPlayedChallengeNumberCellsClaimed}
                .buttonHandler=${() => {
                  this.#game.postMessage({type: 'OnNextChallengeClicked'})
                }}
              >
            </dialog-staying>`
            break
          case 'WrongLevelBanned':
            dialog = html`
              <dialog-unauthorized
              subLvl=${ifDefined(this.#game.subLvl)}
              .buttonLevel=${this.#msg.lvl}
              .buttonHandler=${() => {
                this.#msg
                  ? this.#game.postMessage(this.#msg)
                  : console.log('no msg')
              }}
              >
            </dialog-unauthorized>`
            break
          default:
            this.#msg satisfies never
        }

        break
      }
      default:
        this.ui satisfies never
    }

    const boxes = this.#game.fieldConfig
      ? this.#game.fieldConfig.wh.w * this.#game.fieldConfig.wh.h
      : 0
    return html`
      <div
        class='box'
        style='
          --color-theme: ${unsafeCSS(
            cssHex(levelBaseColor[this.#game.subLvl ?? 0]),
          )};
          --color-theme-dark: ${unsafeCSS(
            cssHex(levelShadowColor[this.#game.subLvl ?? 0]),
          )};
          --color-theme-light: ${unsafeCSS(
            cssHex(levelHighlightColor[this.#game.subLvl ?? 0]),
          )};
        '>
        <bf-terminal
          @game-debug='${(ev: CustomEvent<string>) => {
            this.#dbgLog += `\n${ev.detail}`
            this.requestUpdate()
          }}'
          @game-ui='${(ev: CustomEvent<{ui: UI; msg: DialogMessage}>) => {
            this.ui = ev.detail.ui
            this.#msg = ev.detail.msg
          }}'
          @game-update='${() => this.requestUpdate()}'
          @claim='${this.#onClaim}'
          @open-leaderboard='${() => this.#game.postMessage({type: 'OpenLeaderboard'})}'
          bannedPlayers='${this.#game.bannedPlayers}'
          challenge='${ifDefined(this.#game.challenge)}'
          ?online='${this.#game.connected}'
          ?cooldown='${this.#game.isCooldown()}'
          fieldBans='${ifDefined(this.#game.fieldConfig?.bans)}'
          fieldBoxes='${boxes}'
          level='${ifDefined(this.#game.subLvl)}'
          ?loading='${this.ui === 'Loading'}'
          p1Boxes='${ifDefined(this.#game.p1BoxCount)}'
          sub='${ifDefined(this.#game.sub)}'
          players='${this.#game.players}'
          challengeScoreFlamingo='${ifDefined(this.#game.teamBoxCounts?.[0])}'
          challengeScoreJuiceBox='${ifDefined(this.#game.teamBoxCounts?.[1])}'
          challengeScoreLasagna='${ifDefined(this.#game.teamBoxCounts?.[2])}'
          challengeScoreSunshine='${ifDefined(this.#game.teamBoxCounts?.[3])}'
          globalScoreFlamingo='${ifDefined(this.#game.globalStandings?.[0])}'
          globalScoreJuiceBox='${ifDefined(this.#game.globalStandings?.[1])}'
          globalScoreLasagna='${ifDefined(this.#game.globalStandings?.[2])}'
          globalScoreSunshine='${ifDefined(this.#game.globalStandings?.[3])}'
          team='${ifDefined(team)}'
          x='${this.#game.select.x}'
          y='${this.#game.select.y}'
        ></bf-terminal>
        ${this.#dbgLog ? html`<pre>${this.#dbgLog}</pre>` : ''}
        ${dialog}
      </div>
    `
  }

  #onClaim(ev: CustomEvent<XY>): void {
    this.#game.claimBox(ev.detail)
  }
}
