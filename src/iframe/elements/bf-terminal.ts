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
import type {TeamPascalCase} from '../../shared/team.ts'
import {cssHex, paletteBlack} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

import './bf-control-panel.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-terminal': BFTerminal
  }
}

@customElement('bf-terminal')
export class BFTerminal extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: block;
      height: 100%;
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
  `

  @queryAsync('canvas') accessor canvas!: Promise<HTMLCanvasElement>

  @property({type: Boolean}) accessor loading: boolean = false
  @property() accessor team: TeamPascalCase | undefined
  @property({type: Number}) accessor x: number = 0
  @property({type: Number}) accessor y: number = 0

  protected override render(): TemplateResult {
    return html`
      <div
        class='terminal'
        style='pointer-events: ${this.loading ? 'none' : 'initial'}'
      >
        <div class='canvas-box'>
          <!--- Set tabIndex to propagate key events. -->
          <canvas tabIndex='0'></canvas>
        </div>
        <bf-control-panel
          team='${ifDefined(this.team)}'
          x='${this.x}'
          y='${this.y}'
        ></bf-control-panel>
      </div>
    `
  }
}
