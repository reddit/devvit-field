import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssHex, paletteBlack} from '../../shared/theme.ts'
import type {Icon} from './bf-icon.ts'
import {cssReset} from './css-reset.ts'

import './bf-icon.ts'

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
      --width: unset;
      display: inline-block;
      width: fit-content;
    }

    button {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: min-content;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      border-style: none;
      justify-content: center;
      border-width: 2px;
      border-style: solid;
      border-color: ${unsafeCSS(cssHex(paletteBlack))};
      box-shadow: 0 5px #000;
      margin-bottom: 3px;

      background-image: linear-gradient(
        to bottom,
        #0000 .5px,
        #fff .5px,
        #fff 2.5px,
        #0000 2.5px
      );
      background-position: 2px 0;
      background-size: calc(100% - 4px) 100%;
      background-repeat: no-repeat;

      width: var(--width);

      /* Position pseudoelement relative. */
      position: relative;

      padding-top: 3px;
      padding-right: 16px;
      padding-bottom: 3px;
      padding-left: 16px;
      font-size: 20px;
      font-style: normal;
      font-weight: 600;
      line-height: 26px;
      letter-spacing: -0.3px;
    }

    button.icon-button {
      padding-right: 8px;
      padding-left: 8px;
    }

    button::after {
      display: block;
      content: '';
      width: 100%;
      height: 7px;
      background: var(--color-grey);
      position: absolute;
      bottom: -7px;
      border-color: ${unsafeCSS(cssHex(paletteBlack))};
      border-width: 2px;
      border-inline-start-width: 0;
      border-inline-end-width: 0;
      border-style: solid;
    }

    button:active {
      transform: translateY(2px);
      box-shadow: 0 3px #000;
    }

    button:active::after {
      border-width: 0;
      height: 1px;
      bottom: -3px;
    }

    button:disabled {
      cursor: unset;
    }

    button:focus {
      outline-color: var(--color-black);
    }

    /* Size: small. */
    :host([size='Small']) button {
      padding-top: 12px;
      padding-right: 16px;
      padding-bottom: 12px;
      padding-left: 16px;
      font-size: 20px;
      font-size: 50px;
      font-style: normal;
      font-weight: 600;
      line-height: 26px;
      letter-spacing: -0.3px;
    }
    :host([size='Small']) button.icon-button {
      padding-right: 10px;
      padding-left: 10px;
    }

    /* Appearance: flamingo. */
    :host([appearance='Flamingo']) button {
      background-color: var(--color-flamingo);
    }
    :host([appearance='Flamingo']:hover) button {
      background-color: var(--color-flamingo-light);
    }
    :host([appearance='Flamingo']:active) button {
      background-color: var(--color-flamingo-dark);
    }
    :host([appearance='Flamingo']) button:disabled {
      background-color: var(--color-grey);
    }

    /* Appearance: juice box.  */
    :host([appearance='JuiceBox']) button {
      background-color: var(--color-juice-box);
    }
    :host([appearance='JuiceBox']:hover) button {
      background-color: var(--color-juice-box-light);
    }
    :host([appearance='JuiceBox']:active) button {
      background-color: var(--color-juice-box-dark);
    }
    :host([appearance='JuiceBox']) button:disabled {
      background-color: var(--color-grey);
    }

    /* Appearance: lasagna.  */
    :host([appearance='Lasagna']) button {
      background-color: var(--color-lasagna);
    }
    :host([appearance='Lasagna']:hover) button {
      background-color: var(--color-lasagna-light);
    }
    :host([appearance='Lasagna']:active) button {
      background-color: var(--color-lasagna-dark);
    }
    :host([appearance='Lasagna']) button:disabled {
      background-color: var(--color-grey);
    }

    /* Appearance: sunshine.  */
    :host([appearance='Sunshine']) button {
      background-color: var(--color-sunshine);
    }
    :host([appearance='Sunshine']:hover) button {
      background-color: var(--color-sunshine-light);
    }
    :host([appearance='Sunshine']:active) button {
      background-color: var(--color-sunshine-dark);
    }
    :host([appearance='Sunshine']) button:disabled {
      background-color: var(--color-grey);
    }
  `

  @property() accessor appearance:
    | 'Flamingo'
    | 'JuiceBox'
    | 'Lasagna'
    | 'Sunshine'
    | '' = ''
  @property({type: Boolean}) accessor disabled: boolean = false
  @property() accessor endIcon: Icon | undefined
  @property() accessor icon: Icon | undefined
  @property({attribute: 'icon-color'}) accessor iconColor: string = ''
  @property() accessor size: 'Small' | 'Medium' = 'Medium'
  @property() accessor label = ''

  protected override render(): TemplateResult {
    const iconOnly = this.icon && !this.label && !this.endIcon
    const icon =
      this.icon &&
      html`
        <bf-icon
          size=${this.size}
          icon=${this.icon}
          color=${this.iconColor}
        ></bf-icon>
      `
    const endIcon =
      this.endIcon &&
      html`
        <bf-icon
          size=${this.size}
          icon=${this.endIcon}
          color=${this.iconColor}
        ></bf-icon>
      `
    return html`
      <button ?disabled=${this.disabled} class=${iconOnly ? 'icon-button' : ''}>
        ${icon}
        <slot></slot>
        ${this.label && html`<span>${this.label}</span>`}
        ${endIcon}
      </button>
    `
  }
}
