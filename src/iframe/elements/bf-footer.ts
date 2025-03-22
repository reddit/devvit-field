import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {abbreviateNumber} from '../../shared/format.ts'
import {localize} from '../../shared/locale.ts'
import {createFooterEnd} from '../../shared/svg-factories/createFooterEnd.ts'
import {createFooterMiddle} from '../../shared/svg-factories/createFooterMiddle.ts'
import {createFooterStart} from '../../shared/svg-factories/createFooterStart.ts'
import {createPersonIcon} from '../../shared/svg-factories/createPersonIcon.ts'
import {TITLE_NOTCH_HEIGHT} from '../../shared/svg-factories/footerSettings.ts'
import {
  type Team,
  type TeamPascalCase,
  teamPascalCase,
} from '../../shared/team.ts'
import {spacePx} from '../../shared/theme.ts'
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

    .title {
        margin-top: ${spacePx}px;
        line-height: ${TITLE_NOTCH_HEIGHT}px;
        font-size: 12px;
        color: var(--color-white);
    }

    .scores {
        list-style-type: none;
        padding: 0 24px;
        margin: ${spacePx}px 0 0 0;
        display: flex;
        flex-direction: row;
        gap: ${spacePx}px;
        max-width: 380px;
    }

    .scores li {
        width: 25%;
        height: 28px;
        background: green;
        color: var(--color-black);
        display: flex;
        flex-direction: row;
        justify-content: start;
    }

    .score {
        line-height: 20px;
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
        text-align: center;
        font-size: 14px;
        border-width: ${spacePx / 2}px;
        border-style: solid;
        border-color: var(--color-shade-50);
    }

    .icon {
      height: 28px;
      width: 28px;
      flex-shrink: 0;
      flex-grow: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: var(--color-shade-50);
    }

    .icon svg {
      width: 12px;
      height: 12px;
      display: block;
    }

    .JuiceBox {
        background-color: var(--color-juice-box);
    }

    .Flamingo {
        background-color: var(--color-flamingo);
    }

    .Lasagna {
        background-color: var(--color-lasagna);
    }

    .Sunshine {
        background-color: var(--color-sunshine);
    }`

  @property({type: Object}) accessor msg:
    | DialogMessage
    | ChallengeCompleteMessage
    | undefined

  @property() accessor team: TeamPascalCase | undefined
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0

  protected override render(): TemplateResult {
    const orderedTeams: {
      id: Team
      score: number
    }[] = [
      {
        id: 1,
        score: this.juiceBox,
      },
      {
        id: 0,
        score: this.flamingo,
      },
      {
        id: 2,
        score: this.lasagna,
      },
      {
        id: 3,
        score: this.sunshine,
      },
    ]

    return html`
      <div class="background">
        <div class="cap" .innerHTML=${createFooterStart()}></div>
        <div class="middle" .innerHTML=${createFooterMiddle()}></div>
        <div class="cap" .innerHTML=${createFooterEnd()}></div>
      </div>
      <div class="content">
        <p class="title">${localize('game-footer-title')}</p>
        <ul class="scores">
          ${orderedTeams.map(team => {
            const name = teamPascalCase[team.id]
            return html`
              <li class="${name}">
                ${
                  this.team === name
                    ? html`
                <div class="icon" .innerHTML=${createPersonIcon(team.id)}></div>`
                    : ''
                }
                <div class="score">${abbreviateNumber(team.score)}</div>
              </li>`
          })}
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
