import {
  type CSSResultGroup,
  LitElement,
  type PropertyValues,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property, query} from 'lit/decorators.js'
import {cssHex, paletteBlack, paletteDarkGrey} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {Game} from '../game/game.ts'
import {cssReset} from './css-reset.ts'

import './bf-control-panel.ts'
import './bf-footer.ts'

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
  'Loading' | 'Playing'
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
      background-color: ${unsafeCSS(cssHex(paletteDarkGrey))};
    }

    canvas {
      /* cursor: none; Cursor provided by app. */
      display: none;
      image-rendering: pixelated;
      /* Update on each pointermove *touch* Event like *mouse* Events. */
      touch-action: none;
      outline: none; /* Disable focus outline. */
      border-style: solid;
      border-width: 1px;
      border-color: ${unsafeCSS(cssHex(paletteBlack))};
      border-radius: 1px;
    }

    .canvas-box {
      height: 100%;
    }

    .terminal {
      height: 100%;
      overflow: hidden;
      border-style: solid;
      border-radius: 2px;
      border-width: 2px;
      border-bottom-width: 0;
      border-color: ${unsafeCSS(cssHex(paletteBlack))};
      margin-block-start: 8px;
      margin-inline-start: 5px;
      margin-inline-end: 5px;

      padding-block-start: 8px;
      padding-block-end: 70px;
      padding-inline-start: 11px;
      padding-inline-end: 11px;
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
    if (this.ui === 'Loading' && this.#game.mode === 'PopOut')
      this.ui = 'Playing'
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

    switch (this.ui) {
      case 'Loading':
        break
      case 'Playing':
        break
      default:
        this.ui satisfies never
    }

    return html`
      <div class='terminal'>
        <div class='canvas-box'>
          <canvas
            @game-ui='${(ev: CustomEvent<UI>) => (this.ui = ev.detail)}'
            @game-update='${() => this.requestUpdate()}'
            tabIndex='0'
          ></canvas> <!--- Set tabIndex to propagate key events. -->
        </div>
        <bf-control-panel
          @claim='${this.#onClaim}'
          x='${this.#game.select.x}'
          y='${this.#game.select.y}'
        ></bf-control-panel>
      </div>
      <bf-footer></bf-footer>
    `
  }

  #onClaim(ev: CustomEvent<XY>): void {
    this.#game.claimBox(ev.detail)
  }
}
