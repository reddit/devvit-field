import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, query} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import {Game} from '../game/game.ts'
import {cssReset} from './css-reset.ts'

import './footer-el.ts'
import './header-el.ts'

declare global {
  interface HTMLElementEventMap {
    /** Request update; Game properties have changed. */
    'game-update': undefined
  }
  interface HTMLElementTagNameMap {
    'game-el': GameEl
  }
}

/**
 * Game canvas wrapper and DOM UI. Pass primitive properties to children so
 * that @game-update updates children.
 */
@customElement('game-el')
export class GameEl extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    *,
    ::before,
    ::after {
      box-sizing: border-box; /* Dimensions include any border and padding. */
      -webkit-tap-highlight-color: transparent;
      outline: none; /* Disable focus outline. */
      user-select: none;
      -webkit-touch-callout: none; /* to-do: Disable context menu on iOS? */
    }

    canvas {
      /* cursor: none; Cursor provided by app. */
      display: none;
      image-rendering: pixelated;
      /* Update on each pointermove *touch* Event like *mouse* Events. */
      touch-action: none;
    }

    .canvas-box {
      height: 100%;
      overflow: hidden;
    }
  `

  #game: Game = new Game()
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

  override render(): TemplateResult {
    const visibleRatio =
      this.#game.fieldConfig && this.#game.visible != null
        ? this.#game.visible /
          (this.#game.fieldConfig.wh.w * this.#game.fieldConfig.wh.h)
        : undefined

    return html`
      <header-el
        challenge='${ifDefined(this.#game.challenge)}'
        level='${ifDefined(this.#game.lvl)}'
        visible-ratio='${ifDefined(visibleRatio)}'
      ></header-el>
      <div class='canvas-box'>
        <canvas
          @game-update='${() => this.requestUpdate()}'
          tabIndex='0'
        ></canvas> <!--- Set tabIndex to propagate key events. -->
      </div>
      <footer-el
        score='${ifDefined(this.#game.score)}'
        team='${ifDefined(this.#game.team)}'
      ></footer-el>
    `
  }
}
