import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'header-el': HeaderEl
  }
}

@customElement('header-el')
export class HeaderEl extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: flex;
      background: grey;
      justify-content: space-between;
    }
  `

  @property({type: Number}) accessor challenge: number | undefined
  @property() accessor level: string = ''
  @property({type: Number}) accessor players: number = 0
  /** Ratio of cells visible; [0, 1]. */
  @property({attribute: 'visible-ratio', type: Number})
  accessor visibleRatio: number | undefined

  override render(): TemplateResult {
    if (this.challenge == null || !this.level || this.visibleRatio == null)
      return html`&nbsp;`
    return html`
      <span class='challenge'>Banfield #${this.challenge}</span>
      <span class='level'>r/${this.level}</span>
      <span class='players'>${this.players ? html`${this.players} online` : 'offline'}</span>
      <span class='visible'>${(this.visibleRatio * 100).toFixed(2)}%</span>
    `
  }
}
