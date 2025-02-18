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
    'bf-header': BFHeader
  }
}

@customElement('bf-header')
export class BFHeader extends LitElement {
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
  @property({attribute: 'visible', type: Number})
  accessor visible: number | undefined

  override render(): TemplateResult {
    if (this.challenge == null || !this.level || this.visible == null)
      return html` `
    return html`
      <span class='challenge'>BanField #${this.challenge}</span>
      <span class='level'>r/${this.level}</span>
      <span class='players'>${this.players ? html`${this.players} online` : 'offline'}</span>
      <span class='visible'>${(this.visible * 100).toFixed(2)}%</span>
    `
  }
}
