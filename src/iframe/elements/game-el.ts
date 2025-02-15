import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, query} from 'lit/decorators.js'
import {Game} from '../game/game.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'game-el': GameEl
  }
}

@customElement('game-el')
export class GameEl extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: block;
      width: 100%;
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
        cursor: none; /* Cursor provided by app. */
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
    return html`
      <div>
        <h1>hello</h1>
      </div>
      <div class='canvas-box'>
        <canvas tabIndex='0'></canvas>
      </div>
    `
  }
}
