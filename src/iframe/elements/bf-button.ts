import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement} from 'lit/decorators.js'
import {radiusPx} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-button': PlayButton
  }
}

@customElement('bf-button')
export class PlayButton extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: inline-block;
      width: fit-content;
    }

    /* Default button styles. Medium size. */
    button {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: min-content;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      border-style: none;
      border-radius: ${radiusPx}px;
    }
  `

  protected override render(): TemplateResult {
    return html`<button><slot></slot></button>`
  }
}
