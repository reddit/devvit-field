import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssReset} from './css-reset.ts'

import './bf-button.ts'
import './bf-coords.ts'
import {cssHex, paletteDarkGrey} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {Bubble} from './bubble.ts'

declare global {
  interface HTMLElementEventMap {
    claim: CustomEvent<XY>
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
      height: 93px;
      width: 100%;
    }

    /* bf-button {
      width: 100%;
      max-width: 258px;
    } */

    bf-coords {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 84px;
    }

    .cluster {
      height: 93px;
      width: 52px;
      background-color: ${unsafeCSS(cssHex(paletteDarkGrey))};
    }

    .panel {
      align-items: flex-end;
      display: flex;
      justify-content: space-between;
      height: 73px;
    }
  `

  @property({type: Number}) accessor x: number = 0
  @property({type: Number}) accessor y: number = 0

  protected override render(): TemplateResult {
    return html`
      <bf-coords x='${this.x}' y='${this.y}' ></bf-coords>
      <div class='panel'>
        <div class='cluster'>abc</div>
        <bf-button @click='${() => this.dispatchEvent(Bubble('claim', {x: this.x, y: this.y}))}'>Claim</bf-button>
        <div class='cluster'>def</div>
      </div>
    `
  }
}
