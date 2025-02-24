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
      font-family: 'Departure Mono';
      text-align: center;
      padding-block-start: 2px;
      padding-block-end: 2px;
    }

    a {
      color: ${unsafeCSS(cssHex(paletteTerminalGreen))};
    }
  `

  protected override render(): TemplateResult {
    return html`
      <a
        href='https://reddit.com/r/gamesonreddit'
        target="_blank"
      >r/GamesOnReddit</a>
    `
  }
}
