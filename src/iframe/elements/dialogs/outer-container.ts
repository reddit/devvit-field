import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {radiusPx, spacePx} from '../../../shared/theme.ts'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../../shared/types/message.ts'
import {cssReset} from '../css-reset.ts'

import './inner-container.ts'
import type {Level} from '../../../shared/types/level.ts'
import {getOuterText} from './helpers/getOuterText.ts'
import type {Team} from '../../../shared/team.ts'

declare global {
  interface HTMLElementTagNameMap {
    'outer-container': OuterContainer
  }
}

@customElement('outer-container')
export class OuterContainer extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      max-width: 320px;
    }

    .outer-container {
      border-radius: ${radiusPx}px;
      box-shadow: 0 ${spacePx / 4}px ${spacePx}px var(--color-shade-19);
      background-color: var(--color-field-dark);
      color: var(--color-white);
      border-style: solid;
      border-color: var(--color-field-light);
      border-width: 2px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: ${spacePx}px;
      position: relative;
      font-family: 'Departure Mono', 'Courier New', monospace;
      padding: 1rem;
      margin: 0 auto;
      margin-bottom: 2rem;
      padding-bottom: 0.5rem;
    }
    .caps {
      text-transform: uppercase;
    }
    
    .icon {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-field-dark);
      border: 2px solid var(--color-field-light);
      border-radius: 4px;
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      z-index: 2;
    }
    
    .message {
      margin-bottom: 0.5rem;
    }
    .medium-text {
      font-size: 1rem;
    }
    .small-text {
      font-size: .75rem;
      text-align: center;
      color: white;
    }
    #outer-text {
      display: flex;
      flex-direction: column; 
      margin-top: 0.5rem;
    }
    `

  @property({type: Object}) accessor msg:
    | DialogMessage
    | ChallengeCompleteMessage
    | undefined
  @property({type: Number}) accessor currentLevel: Level = 0
  @property({type: Array}) accessor winners: Team[] | undefined

  protected override render(): TemplateResult {
    let playerClaimedCells = undefined
    if (
      this.msg?.type === 'Dialog' &&
      (this.msg.code === 'ChallengeEndedAscend' ||
        this.msg.code === 'ChallengeEndedStay')
    ) {
      playerClaimedCells = this.msg.profile.globalPointCount
    }

    return html`
    <div class="outer-container">
      <div class="icon">
        <img
          src="/assets/dialog-icon.svg"
          alt="field icon"
        />
      </div>

      <inner-container .msg=${this.msg} .winners=${this.winners}></inner-container>

      <div id="outer-text">
        ${getOuterText(this.msg, this.currentLevel, playerClaimedCells)}
      </div>
    </div>
    `
  }
}
