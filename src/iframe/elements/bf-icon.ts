import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  type nothing,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {styleMap} from 'lit/directives/style-map.js'
import {cssReset} from './css-reset.ts'

export type Icon = 'menu' | 'zoom-in' | 'zoom-out'

declare global {
  interface HTMLElementTagNameMap {
    'bf-icon': BFIcon
  }
}

@customElement('bf-icon')
export class BFIcon extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    div {
      width: 24px;
      height: 24px;
      background-size: 24px;
      opacity: 50%;
    }

    :host([size='Small']) div {
      background-size: 16px;
      width: 16px;
      height: 16px;
    }
  `

  @property({type: String}) accessor size: 'Small' | 'Medium' = 'Medium'
  @property({type: String}) accessor color = 'currentColor'
  @property({type: String}) accessor icon: Icon | undefined

  protected override render(): TemplateResult | typeof nothing {
    if (!this.icon) return html``
    const style = {
      backgroundImage: `url(assets/icon/${this.icon}.svg)`,
      color: this.color,
      fill: this.color,
    }
    return html`<div style=${styleMap(style)}></div>`
  }
}
