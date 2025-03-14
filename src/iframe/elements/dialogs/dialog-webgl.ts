import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement} from 'lit/decorators.js'
import {cssReset} from '../css-reset.ts'

import {lineBreakToken, localize} from '../../../shared/locale.ts'
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

  protected override render(): TemplateResult {
    return html`
      <bf-dialog
        .subLvl=${0}
        .showButton=${false}
        .showMarketing=${false}>
        <div class="container">
          <dialog-container .height=${200} .subLvl=${0}>
          ${localize('error-dialog-no-webgl')
            .split(lineBreakToken)
            .map(line => html`<p>${line}</p>`)}
          </dialog-container>
        </div>
      </bf-dialog>`
  }
}
