import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import type {TeamPascalCase} from '../../shared/team.ts'
import {spacePx} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {Bubble} from './bubble.ts'
import {cssReset} from './css-reset.ts'

import './bf-button.ts'
import './bf-coords.ts'

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
      display: flex;
      justify-content: center;
      width: 100%;
      padding: ${spacePx}px;
    }

    bf-coords {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 88px;
    }

    .claim-button {
      margin: ${spacePx}px;
      text-transform: uppercase;
    }

  `

  @property({type: Boolean}) accessor cooldown: boolean = false
  @property() accessor team: TeamPascalCase | undefined
  @property({type: Number}) accessor x: number = 0
  @property({type: Number}) accessor y: number = 0

  protected override render(): TemplateResult {
    // to-do: fix PascalCase team.
    const claim = this.team
      ? `${this.cooldown ? 'Claiming' : 'Claim'} for ${this.team}`
      : 'Claim'
    return html`
      <bf-coords x='${this.x}' y='${this.y}'></bf-coords>
      <bf-button
        @click='${() => this.dispatchEvent(Bubble('claim', {x: this.x, y: this.y}))}'
        appearance='${ifDefined(this.team)}'
        class='claim-button'
        label='${claim}'
        ?disabled='${!this.team || this.cooldown}'
        style='--width: 256px;'
      ></bf-button>
    `
  }
}
