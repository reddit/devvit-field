import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import type {Game} from '../game/game.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'overlay-el': OverlayEl
  }
}

@customElement('overlay-el')
export class OverlayEl extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
  `

  @property({attribute: false}) accessor game: Game | undefined

  override render(): TemplateResult {
    if (!this.game) return html``
    return html``
  }
}
