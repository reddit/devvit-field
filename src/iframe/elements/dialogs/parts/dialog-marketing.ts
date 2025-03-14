import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {localize} from '../../../../shared/locale.ts'
import {spacePx} from '../../../../shared/theme.ts'
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
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${spacePx}px;
    }

    .marketing {
      opacity: 1;
      transition: opacity 0.2s ease-out;
      cursor: pointer;
    }

    .marketing:hover {
      opacity: 0.7;
    }

    p {
      font-size: 12px;
      color: var(--color-);
      text-transform: uppercase;
    }

    img {
      width: 256px;
    }`

  @property({type: Number}) accessor subLvl: Level | undefined

  protected override render(): TemplateResult {
    return html`
      <div class="marketing" @click=${() => console.log('to-do: navigate to r/GamesOnReddit')}>
        <p>${localize('games-on-reddit-header')}</p>
        <!-- to-do: swap to a higher res asset. + swap based on level. -->
        <img
          src="/assets/games-on-reddit-logo.svg"
          alt="r/GamesOnReddit logo"
          class="logo" />
      </div>`
  }
}
