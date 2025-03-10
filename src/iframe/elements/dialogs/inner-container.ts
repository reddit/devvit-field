import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import type {Team} from '../../../shared/team.ts'
import {radiusPx, spacePx} from '../../../shared/theme.ts'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../../shared/types/message.ts'
import {cssReset} from '../css-reset.ts'
import {getInnerText} from './helpers/getInnerText.ts'

declare global {
  interface HTMLElementTagNameMap {
    'inner-container': InnerContainer
  }
}

@customElement('inner-container')
export class InnerContainer extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      max-width: 320px;
    }

    .inner-container {
      padding: ${spacePx}px;
      border-radius: ${radiusPx}px;
      border-style: double;
      box-shadow: 0 ${spacePx / 4}px ${spacePx}px var(--color-shade-19);
      background-color: var(--color-black);
      border-color: var(--color-field-light);
      border-width: 2px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      margin-top: 1rem;

      font-family: 'Departure Mono', 'Courier New', monospace;
      text-align: center;
      font-size: 1.5rem;
      color: var(--color-field-light); //TODO: change to leaderboardButton?
    }
    .caps {
      text-transform: uppercase;
    }
    .medium-text {
      font-size: 1rem;
    }
    .white {
      color: var(--color-white);
    }
  `

  @property({type: Object}) accessor msg:
    | DialogMessage
    | ChallengeCompleteMessage
    | undefined
  @property({type: Array}) accessor winners: Team[] | undefined

  protected override render(): TemplateResult {
    return html`
    <div class="inner-container">
      ${getInnerText(this.msg, this.winners)}
    </div>
    `
  }
}
