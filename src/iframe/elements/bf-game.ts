import {
  type CSSResultGroup,
  LitElement,
  type PropertyValues,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property, query} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import {Game} from '../game/game.ts'
import {cssReset} from './css-reset.ts'

import './bf-claim-button.ts'
import './bf-footer.ts'
import './bf-header.ts'
import './bf-team-chart.ts'
import './bf-welcome-dialog.ts'
import {spacePx} from '../../shared/theme.ts'

declare global {
  interface HTMLElementEventMap {
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
  // | 'Banned'
  'Intro' | 'Loading' | 'Playing'
// | 'Promoted'
// | 'Replaying'
// | 'Scored'

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

    bf-claim-button {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: ${spacePx}px;
    }

    canvas {
      /* cursor: none; Cursor provided by app. */
      display: none;
      image-rendering: pixelated;
      /* Update on each pointermove *touch* Event like *mouse* Events. */
      touch-action: none;
      outline: none; /* Disable focus outline. */
    }

    .canvas-box {
      height: 100%;
      overflow: hidden;
    }
  `

  @property({reflect: true}) accessor ui: UI = 'Loading'

  #game: Game = new Game(this)
  @query('canvas') private accessor _canvas!: HTMLCanvasElement

  override async connectedCallback(): Promise<void> {
    super.connectedCallback()
    await this.updateComplete
    this.#game.start(this._canvas)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#game.stop()
  }

  protected override update(props: PropertyValues<this>): void {
    super.update(props)
    if (this.ui === 'Loading' && this.#game.mode === 'PopOut') this.ui = 'Intro'
  }

  override render(): TemplateResult {
    const fieldSize = this.#game.fieldConfig
      ? this.#game.fieldConfig.wh.w * this.#game.fieldConfig.wh.h
      : 0
    const visible =
      this.#game.fieldConfig && this.#game.visible != null
        ? this.#game.visible / fieldSize
        : undefined
    const score =
      this.#game.team != null && this.#game.teamBoxCounts
        ? this.#game.teamBoxCounts[this.#game.team]
        : undefined

    let button
    let dialog
    switch (this.ui) {
      case 'Intro':
        // to-do: literally forcing the user to stop and consent to the dialog
        //        feels like an antipattern. What in the world do we have to say
        //        that is so important? Verify this makes sense with Knut.
        if (this.#game.teamBoxCounts)
          dialog = html`
        <bf-welcome-dialog
          @close='${this.#onIntroClose}'
          challenge=${this.#game.challenge ?? 0}
          sub=${this.#game.sub ?? ''}
          flamingo='${this.#game.teamBoxCounts[0]}'
          juiceBox='${this.#game.teamBoxCounts[1]}'
          lasagna='${this.#game.teamBoxCounts[2]}'
          sunshine='${this.#game.teamBoxCounts[3]}'
          open
        ></bf-welcome-dialog>
      `
        break
      case 'Loading':
        break
      case 'Playing':
        button = html`<bf-claim-button></bf-claim-button>`
        break
      default:
        this.ui satisfies never
    }

    return html`
      ${dialog}
      <bf-header
        challenge='${ifDefined(this.#game.challenge)}'
        level='${ifDefined(this.#game.sub)}'
        players='${this.#game.players}'
        visible='${ifDefined(visible)}'
      ></bf-header>
      ${button}
      <div class='canvas-box'>
        <canvas
          @game-ui='${(ev: CustomEvent<UI>) => (this.ui = ev.detail)}'
          @game-update='${() => this.requestUpdate()}'
          tabIndex='0'
        ></canvas> <!--- Set tabIndex to propagate key events. -->
      </div>
      <bf-footer
        score='${ifDefined(score)}'
        team='${ifDefined(this.#game.team)}'
      ></bf-footer>
    `
  }

  #onIntroClose(): void {
    this.ui = 'Playing'
  }
}
