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
    'bf-footer': BFFooter
  }
}

@customElement('bf-footer')
export class BFFooter extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: flex;
      background: grey;
      justify-content: space-between;
    }
  `

  @property({type: Number}) accessor score: number | undefined
  @property() accessor team: string = ''

  override render(): TemplateResult {
    if (this.score == null || !this.team) return html`&nbsp;`
    return html`
      <span class='score'>${this.team}: ${this.score}</span>
      <span></span>
      <a href='https://reddit.com/r/gamesonreddit'>r/GamesOnReddit</a>
    `
  }
}
