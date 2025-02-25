import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property, query} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import {teamPascalCase} from '../../shared/team.ts'
import {cssHex, paletteBlack, paletteDarkGrey} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {Game} from '../game/game.ts'
import {cssReset} from './css-reset.ts'

import './bf-control-panel.ts'
import './bf-footer.ts'

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
      display: flex;
      flex-direction: column;
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
      padding-inline-start: 11px;
      padding-inline-end: 11px;
    }

    pre {
      height: 100px;
      overflow: auto;
      background: #fff;
    }
  `

  // to-do: pass to game.
  @query('canvas') accessor canvas!: HTMLCanvasElement
  @property({reflect: true}) accessor ui: UI = 'Loading'

  #dbgLogs: string[] = []
  #game: Game = new Game(this)

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
      <div
        class='terminal'
        style='pointer-events: ${this.ui === 'Loading' ? 'none' : 'initial'}'
      >
        <div class='canvas-box'>
          <canvas
            @game-debug='${(ev: CustomEvent<string>) => {
              this.#dbgLogs.push(ev.detail)
              this.requestUpdate()
            }}'
            @game-ui='${(ev: CustomEvent<UI>) => (this.ui = ev.detail)}'
            @game-update='${() => this.requestUpdate()}'
            tabIndex='0'
          ></canvas> <!--- Set tabIndex to propagate key events. -->
        </div>
        <bf-control-panel
          @claim='${this.#onClaim}'
          @toggle-side-panel='${this.#onToggleSidePanel}'
          @zoom-in='${() => this.#onZoom(1)}'
          @zoom-out='${() => this.#onZoom(-1)}'
          team='${ifDefined(team)}'
          x='${this.#game.select.x}'
          y='${this.#game.select.y}'
        ></bf-control-panel>
      </div>
      <bf-footer></bf-footer>
      ${this.#dbgLogs.length ? html`<pre>${this.#dbgLogs.join('\n')}</pre>` : ''}
    `
  }

  #onClaim(ev: CustomEvent<XY>): void {
    this.#game.claimBox(ev.detail)
  }

  #onToggleSidePanel(_ev: CustomEvent<XY>): void {
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
