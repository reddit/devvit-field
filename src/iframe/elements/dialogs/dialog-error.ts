import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {fontMSize, spacePx} from '../../../shared/theme.ts'
import {cssReset} from '../css-reset.ts'

import type {Level} from '../../../shared/types/level.ts'

declare global {
  interface HTMLElementTagNameMap {
    'dialog-error': DialogError
  }
}

@customElement('dialog-error')
export class DialogError extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    .container {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .metadata {
      color: var(--color-white);
      flex-grow: 2;
      align-content: center;
      font-size: ${fontMSize}px;
      padding-top: ${spacePx}px;
    }

    h1 {
      font-size: ${fontMSize}px;
      flex-grow: 0;
    }`

  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({type: Number}) accessor buttonLevel: Level = 0
  @property({attribute: false}) accessor buttonHandler: () => void = () => {}

  protected override render(): TemplateResult {
    return html`
      <bf-dialog
        .subLvl=${this.subLvl}
        buttonLevel=${this.buttonLevel}
        buttonLabel=${'Try again'}
        .buttonHandler=${this.buttonHandler}>
        <div class="container">
          <dialog-container
            .height=${200}
            .subLvl=${this.subLvl ?? 0}>
            An error occurred while playing the game. Please try again.
          </dialog-container>
        </div>
      </bf-dialog>`
  }
}
