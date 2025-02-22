import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement} from 'lit/decorators.js'
import {
  cssHex,
  paletteBlack,
  paletteLemonLime,
  radiusPx,
} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-button': BFButton
  }
}

@customElement('bf-button')
export class BFButton extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: inline-block;
      width: fit-content;
    }

    /* Default button styles. Medium size. */
    button {
      background-color: ${unsafeCSS(cssHex(paletteLemonLime))};
      display: flex;
      flex-direction: row;
      align-items: center;
      height: min-content;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      border-style: none;
      border-radius: ${radiusPx}px;
      /* justify-content: center; */
      border-width: 2px;
      border-style: solid;
      border-color: ${unsafeCSS(cssHex(paletteBlack))};
    }
  `

  protected override render(): TemplateResult {
    return html`<button><slot></slot></button>`
  }
}
