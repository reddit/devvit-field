import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property, queryAsync} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import {teamPascalCase} from '../../shared/team.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../shared/types/message.ts'
import {Game} from '../game/game.ts'
import type {BFTerminal} from './bf-terminal.ts'
import {cssReset} from './css-reset.ts'

import './bf-dialog.ts'
import './bf-terminal.ts'

declare global {
  interface HTMLElementEventMap {
    'game-debug': CustomEvent<string>
    'game-ui': CustomEvent<{
      ui: UI
      msg: DialogMessage | ChallengeCompleteMessage | undefined
    }>
    /** Request update; Game properties have changed. */
    'game-update': CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-game': BFGame
  }
}

// to-do: fill out the remaining states.
export type UI =
  | 'Barred' // to-do: rename DialogMessage?
  | 'Loading'
  /** Promoted, replaying / stuck, or demoted. */
  | 'NextLevel' // to-do: rename ChallengeCompleteMessage?
  | 'Playing'
  | 'Scored'

/**
 * Game canvas wrapper and DOM UI. Pass primitive properties to children so
 * that @game-update updates children.
 */
@customElement('bf-game')
export class BFGame extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    pre {
      height: 100px;
      overflow: auto;
      background: #fff;
    }
  `

  @property({reflect: true}) accessor ui: UI = 'Loading'
  @queryAsync('bf-terminal') accessor _terminal!: Promise<BFTerminal>
  #msg: DialogMessage | ChallengeCompleteMessage | undefined

  #dbgLog: string = ''
  #game: Game = new Game(this)

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
    switch (this.ui) {
      case 'Loading':
        // to-do: no background, no nothing.
        break
      case 'Playing':
        break
      case 'Barred':
        if (this.#msg?.type !== 'Dialog') throw Error('no dialog message')
        dialog = html`
          <bf-dialog open>
            <h2>Whoa, you're not allowed here.</h2>
            <p>${this.#msg.message}</p>
            <bf-button
              @click='${() => {
                if (this.#msg?.type !== 'Dialog')
                  throw Error('no dialog message')
                this.#game.postMessage(this.#msg)
                // to-do: clear this.#msg.
              }}'
            >Go to a better place</bf-button>
          </bf-dialog>
        `
        break
      case 'NextLevel': {
        if (this.#msg?.type !== 'ChallengeComplete')
          throw Error('no challenge message')
        const max = Math.max(
          ...this.#msg.standings.map(standing => standing.score),
        )
        const winners = this.#msg.standings
          .filter(standing => standing.score === max)
          .map(standing => standing.member)
        dialog = html`
          <bf-dialog open>
            <h2>The board has been claimed by ${winners.join(' and ')}.</h2>
            <bf-button
              @click='${() => {
                if (this.#msg?.type !== 'ChallengeComplete')
                  throw Error('no challenge message')
                this.#game.postMessage({type: 'OnNextChallengeClicked'})
              }}'
            >Next</bf-button>
          </bf-dialog>
        `
        break
      }
      case 'Scored':
        return html`to-do: fix me.`
      default:
        this.ui satisfies never
    }

    return html`
      ${dialog}
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
        challenge='${ifDefined(this.#game.challenge)}'
        ?cooldown='${this.#game.isCooldown()}'
        level='${ifDefined(this.#game.subLvl)}'
        ?loading='${this.ui === 'Loading'}'
        flamingo='${ifDefined(this.#game.teamBoxCounts?.[0])}'
        juiceBox='${ifDefined(this.#game.teamBoxCounts?.[1])}'
        lasagna='${ifDefined(this.#game.teamBoxCounts?.[2])}'
        sunshine='${ifDefined(this.#game.teamBoxCounts?.[3])}'
        team='${ifDefined(team)}'
        x='${this.#game.select.x}'
        y='${this.#game.select.y}'
      ></bf-terminal>
      ${this.#dbgLog ? html`<pre>${this.#dbgLog}</pre>` : ''}
    `
  }

  #onClaim(ev: CustomEvent<XY>): void {
    this.#game.claimBox(ev.detail)
  }
}
