import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import type {TeamPascalCase} from '../../shared/team.ts'
import {fontMSize, radiusPx, spacePx} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

import type {Level} from '../../shared/types/level.ts'

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
      width: 100%;
      display: flex;
      justify-content: center;
      padding: 0 24px;
    }

    /* Pre-compute keyframe animations for consistency. */
    @keyframes button-press {
      100% {
        transform: translateY(9px);
        box-shadow: 0 3px var(--color-black);
      }
    }

    @keyframes button-after-press {
      100% {
		    height: 3px;
		    bottom: -5px;
		    box-shadow: 0 3px var(--color-shade-50);
      }
    }

    button {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      height: min-content;
      cursor: pointer;
      user-select: none;
      /* white-space: nowrap; */
      border-style: none;
      border-style: solid;
      border-color: var(--color-black);
      color: var(--color-black);
      border-radius: ${radiusPx}px;
      box-shadow: 0 5px #000;
      margin-block-start: ${spacePx}px;
      margin-block-end: ${13 + spacePx / 2}px;
      text-transform: inherit;
      /* Gleam. */
      background-image: linear-gradient(
        to bottom,
        #0000 1px,
        var(--color-tint-75) 1px,
        var(--color-tint-75) 3px,
        #0000 3px
      );
      background-position: 2px 0;
      background-size: calc(100% - 4px) 100%;
      background-repeat: no-repeat;
      width: 100%;
      max-width: var(--max-width);
      /* Position pseudoelement relative. */
      position: relative;
      padding-top: 3px;
      padding-right: 16px;
      padding-bottom: 3px;
      padding-left: 16px;
      font-size: ${fontMSize}px;
      font-style: normal;
      font-weight: 600;
      line-height: 26px;
      letter-spacing: -0.3px;
      font-family: 'Departure Mono', 'Courier New', monospace;
      white-space: nowrap;
    }

    button::after {
      display: block;
      content: '';
      width: calc(100% + 4px);
      left: -2px;
      height: 12px;
      position: absolute;
      bottom: -13px;
      border-color: var(--color-black);
      border-width: 2px;
      border-radius: ${radiusPx}px;
      border-style: solid;
      box-shadow: 0 4px var(--color-shade-50);
      background-color: var(--color-grey);
    }

    button:active {
      animation-name: button-press;
      animation-duration: .06s;
      animation-fill-mode: both;
    }
    button:active::after {
      animation-name: button-after-press;
      animation-duration: .06s;
      animation-fill-mode: both;
    }

    button:disabled {
      cursor: unset;
    }

    button:focus {
      outline-color: var(--color-black);
    }

    /* Appearance: flamingo. */
    :host([appearance='Flamingo']) button {
      background-color: var(--color-flamingo);
    }
    :host([appearance='Flamingo']) button::after {
      background-color: var(--color-flamingo-dark);
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
    :host([appearance='Flamingo']) button:disabled::after {
      background-color: var(--color-grey);
    }

    /* Appearance: juice box.  */
    :host([appearance='JuiceBox']) button {
      background-color: var(--color-juice-box);
    }
    :host([appearance='JuiceBox']) button::after {
      background-color: var(--color-juice-box-dark);
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
    :host([appearance='JuiceBox']) button:disabled::after {
      background-color: var(--color-grey);
    }

    /* Appearance: lasagna.  */
    :host([appearance='Lasagna']) button {
      background-color: var(--color-lasagna);
    }
    :host([appearance='Lasagna']) button::after {
      background-color: var(--color-lasagna-dark);
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
    :host([appearance='Lasagna']) button:disabled::after {
      background-color: var(--color-grey);
    }

    /* Appearance: sunshine.  */
    :host([appearance='Sunshine']) button {
      background-color: var(--color-sunshine);
    }
    :host([appearance='Sunshine']) button::after {
      background-color: var(--color-sunshine-dark);
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
    :host([appearance='Sunshine']) button:disabled::after {
      background-color: var(--color-grey);
    }

    /* Appearance: Field. */
    :host([appearance='0']) button {
      background-color: var(--color-field-light);
    }
    :host([appearance='0']:hover) button {
      background-color: var(--color-field);
    }
    :host([appearance='0']:active) button {
      background-color: var(--color-field);
    }
    :host([appearance='0']) button:disabled {
      background-color: var(--color-grey);
    }
    :host([appearance='0']) button::after {
      background-color: var(--color-field-dark);
    }

    /* Appearance: BannedField.  */
    :host([appearance='1']) button {
      background-color: var(--color-banned-field-light);
    }
    :host([appearance='1']:hover) button {
      background-color: var(--color-banned-field);
    }
    :host([appearance='1']:active) button {
      background-color: var(--color-banned-field);
    }
    :host([appearance='1']) button:disabled {
      background-color: var(--color-grey);
    }
    :host([appearance='1']) button::after {
      background-color: var(--color-banned-field-dark);
    }

    /* Appearance: VeryBannedField.  */
    :host([appearance='2']) button {
      background-color: var(--color-very-banned-field-light);
    }
    :host([appearance='2']:hover) button {
      background-color: var(--color-very-banned-field);
    }
    :host([appearance='2']:active) button {
      background-color: var(--color-very-banned-field);
    }
    :host([appearance='2']) button:disabled {
      background-color: var(--color-grey);
    }
    :host([appearance='2']) button::after {
      background-color: var(--color-very-banned-field-dark);
    }

    /* Appearance: BananaField.  */
    :host([appearance='3']) button {
      background-color: var(--color-banana-field-light);
    }
    :host([appearance='3']:hover) button {
      background-color: var(--color-banana-field);
    }
    :host([appearance='3']:active) button {
      background-color: var(--color-banana-field);
    }
    :host([appearance='3']) button:disabled {
      background-color: var(--color-grey);
    }
    :host([appearance='3']) button::after {
      background-color: var(--color-banana-field-dark);
    }
  `

  @property() accessor appearance: TeamPascalCase | Level | undefined
  @property({type: Boolean}) accessor disabled: boolean = false
  @property({type: Number}) accessor maxWidth: number = 468
  @property() accessor label = ''

  protected override render(): TemplateResult {
    this.style.setProperty('--max-width', `${this.maxWidth}px`)

    return html`
      <button ?disabled=${this.disabled}>
        <slot></slot>
        ${this.label && html`<span>${this.label}</span>`}
      </button>
    `
  }
}
