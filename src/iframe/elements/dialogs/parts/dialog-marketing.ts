import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {localize} from '../../../../shared/locale.ts'
import {createGorLogo} from '../../../../shared/svg-factories/createGorLogo.ts'
import {fontSSize, spacePx} from '../../../../shared/theme.ts'
import type {Level} from '../../../../shared/types/level.ts'
import {cssReset} from '../../css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'dialog-marketing': InnerContainer
  }
}

@customElement('dialog-marketing')
export class InnerContainer extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      padding-top: ${spacePx * 2}px;
    }

    .marketing {
      opacity: 1;
      transition: opacity 0.2s ease-out;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${spacePx}px;
    }

    .marketing:hover {
      opacity: 0.7;
    }

    p {
      font-size: ${fontSSize}px;
      color: var(--color-white);
      text-transform: uppercase;
    }

    svg {
      height: 32px;
    }`

  @property({type: Number}) accessor subLvl: Level | undefined

  protected override render(): TemplateResult {
    return html`
      <div class="marketing" @click=${() => console.log('to-do: navigate to r/GamesOnReddit')}>
        <p>${localize('games-on-reddit-header')}</p>
        <div class="logo-wrapper" .innerHTML=${createGorLogo()}></div>
      </div>`
  }
}
