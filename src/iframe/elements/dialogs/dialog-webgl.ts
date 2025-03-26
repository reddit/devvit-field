import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssReset} from '../css-reset.ts'

import {lineBreakToken, localize} from '../../../shared/locale.ts'
import type {Level} from '../../../shared/types/level.ts'
declare global {
  interface HTMLElementTagNameMap {
    'dialog-webgl': DialogWebgl
  }
}

@customElement('dialog-webgl')
export class DialogWebgl extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    .container {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }`

  @property({type: Number}) accessor subLvl: Level | undefined = 0

  protected override render(): TemplateResult {
    return html`
      <bf-dialog
        .subLvl=${this.subLvl}
        .showButton=${false}
        .showMarketing=${false}>
        <div class="container">
          <dialog-container .height=${200}>
          ${localize('error-dialog-no-webgl')
            .split(lineBreakToken)
            .map(line => html`<p>${line}</p>`)}
          </dialog-container>
        </div>
      </bf-dialog>`
  }
}
