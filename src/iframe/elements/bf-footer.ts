import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {localize} from '../../shared/locale.ts'
import {createFooterEnd} from '../../shared/svg-factories/createFooterEnd.ts'
import {createFooterMiddle} from '../../shared/svg-factories/createFooterMiddle.ts'
import {createFooterStart} from '../../shared/svg-factories/createFooterStart.ts'
import {TITLE_NOTCH_HEIGHT} from '../../shared/svg-factories/footerSettings.ts'
import type {Level} from '../../shared/types/level.ts'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../shared/types/message.ts'
import {Bubble} from './bubble.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementEventMap {
    close: CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-footer': BFFooter
  }
}

@customElement('bf-footer')
export class BFFooter extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
        position: relative;
        width: 100%;
        margin: 8px;
        height: 128px;
    }

    .content,
    .background {
        position: absolute;
        inset: 0;
    }

    .content {
        display: flex;
        flex-direction: column;
        align-content: center;
        text-align: center;
    }

    .background {
        display: flex;
        flex-direction: row;
        width: 100%;
    }

    .cap {
        flex-shrink: 0;
        flex-grow: 0;
    }

    .middle {
        flex-shrink: 1;
        flex-grow: 1;
        display: flex;
        overflow: hidden;
        justify-content: center;
        align-content: center;
    }

    .background svg {
        height: 128px;
        flex-shrink: 0;
    }

    ul {
        list-style-type: none;
        padding: 0 24px;
        margin: 8px 0 0 0;
        display: flex;
        flex-direction: row;
        gap: 4px;
    }

    li {
        width: 25%;
        background: green;
        line-height: 24px;
        font-size: 16px;
        color: var(--color-black);
    }

    .title {
        margin-top: 8px;
        line-height: ${TITLE_NOTCH_HEIGHT}px;
        font-size: 12px;
        color: var(--color-white);
    }

  `

  @property({type: Object}) accessor msg:
    | DialogMessage
    | ChallengeCompleteMessage
    | undefined

  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({attribute: false}) accessor buttonHandler: () => void = () => {}

  protected override render(): TemplateResult {
    return html`
      <div class="background">
        <div class="cap" .innerHTML=${createFooterStart()}></div>
        <div class="middle" .innerHTML=${createFooterMiddle()}></div>
        <div class="cap" .innerHTML=${createFooterEnd()}></div>
      </div>
      <div class="content">
        <p class="title">${localize('game-footer-title')}</p>
        <ul class="scores">
            <li>12.1k</li>
            <li>999</li>
            <li>12.9k</li>
            <li>240.1k</li>
        </ul>
        <div 
            @click='${() => this.dispatchEvent(Bubble('open-leaderboard', undefined))}'
            class="button-wrapper"
        >
        <p>GOR</p>
        </div>
      </div>
    `
  }
}
