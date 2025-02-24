import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssHex, paletteTerminalGreen} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-coords': BFCoords
  }
}

@customElement('bf-coords')
export class BFCoords extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      color: ${unsafeCSS(cssHex(paletteTerminalGreen))};
      display: inline-block;
      font-family: 'Departure Mono';
    }
  `

  @property({type: Number}) accessor x: number = 0
  @property({type: Number}) accessor y: number = 0

  protected override render(): TemplateResult {
    return html`(${this.x.toString().padStart(4, '0')}, ${this.y.toString().padStart(4, '0')})`
  }
}
