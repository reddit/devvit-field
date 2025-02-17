import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssReset} from './css-reset.ts'

import './bf-button.ts'
import './bf-dialog.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-welcome-dialog': BFWelcomeDialog
  }
}

@customElement('bf-welcome-dialog')
export class BFWelcomeDialog extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    bf-dialog {
      text-align: center;
    }
  `

  @property({type: Number}) accessor challenge: number = 0
  @property({type: Boolean, reflect: true}) accessor open: boolean = false
  /** Subreddit name without the r/ prefix. */
  @property() accessor sub: string = ''

  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0

  protected override render(): TemplateResult {
    // to-do: check localStorage in the parent to see if this challenge has
    //        already been acknowledged.
    return html`
      <bf-dialog ?open='${this.open}'>
        <h2>Welcome to r/${this.sub} #${this.challenge}</h2>
        <bf-team-chart
          flamingo='${this.flamingo}'
          juiceBox='${this.juiceBox}'
          lasagna='${this.lasagna}'
          sunshine='${this.sunshine}'
        ></bf-team-chart>
        <bf-button @click=${() => (this.open = false)}>Play</bf-button>
      </bf-dialog>
    `
  }
}
