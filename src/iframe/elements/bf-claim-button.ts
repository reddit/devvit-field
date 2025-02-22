import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement} from 'lit/decorators.js'
import {cssHex, paletteBlack, paletteFlamingo} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-claim-button': BFClaimButton
  }
}

@customElement('bf-claim-button')
export class BFClaimButton extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: inline-block;
      width: 80px;
      height: 80px;
      font-size: 24px;
    }

    button {
      display: flex;
      flex-direction: row;
      align-items: center;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      border-style: none;
      justify-content: center;
      border-radius: 50%;
      /* to-do: fix me. */
      background-color: ${unsafeCSS(cssHex(paletteFlamingo))};
      width: 100%;
      height: 100%;
      border-width: 4px;
      border-style: solid;
      border-color: ${unsafeCSS(cssHex(paletteBlack))};
    }
  `

  protected override render(): TemplateResult {
    return html`<button>Claim</button>`
  }
}
