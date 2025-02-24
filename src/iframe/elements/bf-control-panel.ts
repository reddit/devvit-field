import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssHex, paletteDarkGrey} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {Bubble} from './bubble.ts'
import {cssReset} from './css-reset.ts'

import './bf-button.ts'
import './bf-coords.ts'
import type {TeamPascalCase} from '../../shared/team.ts'

declare global {
  interface HTMLElementEventMap {
    claim: CustomEvent<XY>
    'toggle-side-panel': CustomEvent<undefined>
    'zoom-in': CustomEvent<undefined>
    'zoom-out': CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-control-panel': BFControlPanel
  }
}

@customElement('bf-control-panel')
export class BFControlPanel extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: block;
      width: 100%;
    }

    bf-coords {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 88px;
    }

    .panel {
      align-items: center;
      display: flex;
      justify-content: space-between;
      height: 60px;
    }

    .zoom {
      display: flex;
      flex-direction: column;
      background-color: ${unsafeCSS(cssHex(paletteDarkGrey))};
      padding: 8px;
      margin-bottom: 32px;
    }
  `

  @property() accessor team: TeamPascalCase | undefined
  @property({type: Number}) accessor x: number = 0
  @property({type: Number}) accessor y: number = 0

  protected override render(): TemplateResult {
    return html`
      <bf-coords x='${this.x}' y='${this.y}' ></bf-coords>
      <div class='panel'>
        <bf-button
          @click='${() => this.dispatchEvent(Bubble('toggle-side-panel', undefined))}'
          appearance='${this.team}'
          icon='menu'
        ></bf-button>
        <bf-button
        @click='${() => this.dispatchEvent(Bubble('claim', {x: this.x, y: this.y}))}'
          appearance='${this.team}'
          label='CLAIM'
          style='--width: 255px;'
        ></bf-button>
        <div class='zoom'>
          <bf-button
            @click='${() => this.dispatchEvent(Bubble('zoom-in', undefined))}'
            appearance='${this.team}'
            icon='zoom-in'
          ></bf-button>
          <bf-button
            @click='${() => this.dispatchEvent(Bubble('zoom-out', undefined))}'
            appearance='${this.team}'
            icon='zoom-out'
          ></bf-button>
        </div>
      </div>
    `
  }
}
