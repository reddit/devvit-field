import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement} from 'lit/decorators.js'
import {cssHex, paletteBlack, paletteTerminalGreen} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

import './bf-button.ts'
import './bf-coords.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-footer': BFFooter
  }
}

@customElement('bf-footer')
export class BFFooter extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      background-color: ${unsafeCSS(cssHex(paletteBlack))};
      color: ${unsafeCSS(cssHex(paletteTerminalGreen))};
      display: block;
      font-family: 'Silkscreen';
      text-align: center;
    }

    a {
      color: ${unsafeCSS(cssHex(paletteTerminalGreen))};
    }
  `

  protected override render(): TemplateResult {
    return html`
      Brought to you by <a href='https://reddit.com/r/gamesonreddit'>r/GamesOnReddit</a>
    `
  }
}
