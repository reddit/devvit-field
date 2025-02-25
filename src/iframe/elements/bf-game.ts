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
import {cssHex, paletteDarkGrey} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {Game} from '../game/game.ts'
import {cssReset} from './css-reset.ts'
import type {BFTerminal} from './bf-terminal.ts'

import './bf-footer.ts'
import './bf-terminal.ts'

declare global {
  interface HTMLElementEventMap {
    'game-debug': CustomEvent<string>
    'game-ui': CustomEvent<UI>
    /** Request update; Game properties have changed. */
    'game-update': CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-game': BFGame
  }
}

// to-do: fill out the remaining states.
export type UI =
  | 'Banned' // to-do: rename DialogMessage?
  | 'Loading'
  | 'Playing'
  | 'Promoted' // to-do: rename ChallengeCompleteMessage?
  | 'Replaying' // to-do: rename ChallengeCompleteMessage?
  | 'Demoted' // to-do: rename ChallengeCompleteMessage?
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
      background-color: ${unsafeCSS(cssHex(paletteDarkGrey))};
    }

    pre {
      height: 100px;
      overflow: auto;
      background: #fff;
    }
  `

  @property({reflect: true}) accessor ui: UI = 'Loading'
  @queryAsync('bf-terminal') accessor _terminal!: Promise<BFTerminal>

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

    switch (this.ui) {
      case 'Loading':
        break
      case 'Playing':
        break
      default:
        this.ui satisfies never
    }

    return html`
      <bf-terminal
        @game-debug='${(ev: CustomEvent<string>) => {
          this.#dbgLog += `\n${ev.detail}`
          this.requestUpdate()
        }}'
        @game-ui='${(ev: CustomEvent<UI>) => (this.ui = ev.detail)}'
        @game-update='${() => this.requestUpdate()}'
        @claim='${this.#onClaim}'
        @toggle-side-panel='${this.#onToggleSidePanel}'
        @zoom-in='${() => this.#onZoom(1)}'
        @zoom-out='${() => this.#onZoom(-1)}'
        ?loading='${this.ui === 'Loading'}'
        team='${ifDefined(team)}'
        x='${this.#game.select.x}'
        y='${this.#game.select.y}'
      ></bf-terminal>
      <bf-footer></bf-footer>
      ${this.#dbgLog ? html`<pre>${this.#dbgLog}</pre>` : ''}
    `
  }

  #onClaim(ev: CustomEvent<XY>): void {
    this.#game.claimBox(ev.detail)
  }

  #onToggleSidePanel(ev: CustomEvent<XY>): void {
    // to-do: fill me out.
  }

  #onZoom(incr: number): void {
    const center = {
      x: this.#game.cam.x + this.#game.cam.w / 2,
      y: this.#game.cam.y + this.#game.cam.h / 2,
    }

    this.#game.cam.setFieldScaleLevel(
      this.#game.cam.fieldScaleLevel + incr,
      center,
      this.#game.p1?.profile.superuser ?? false,
    )
  }
}
