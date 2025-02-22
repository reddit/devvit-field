import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {type Team, teamName} from '../../shared/team.ts'
import {cssReset} from './css-reset.ts'

import './bf-button.ts'
import './bf-coords.ts'
import {cssHex, paletteTerminalGreen} from '../../shared/theme.ts'

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
      /* display: flex; */
      background: grey;
      /* justify-content: space-between; */
    }

    bf-coords {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 128px;
    }

    .patron {
      color: ${unsafeCSS(cssHex(paletteTerminalGreen))};
      display: block;
      font-family: 'Silkscreen';
      text-align: center;
    }
  `

  @property({type: Number}) accessor score: number | undefined
  @property({type: Number}) accessor team: Team | undefined
  @property({type: Number}) accessor x: number = 0
  @property({type: Number}) accessor y: number = 0

  override render(): TemplateResult {
    if (this.score == null || this.team == null) return html`&nbsp;`
    return html`
          <bf-coords x='${this.x}' y='${this.y}' ></bf-coords>
          <bf-button>Claim</bf-button>
      <span class='score'>${teamName[this.team]}: ${this.score}</span>
      <span></span>
      <div class='patron'>
        Brought to you by <a href='https://reddit.com/r/gamesonreddit'>r/GamesOnReddit</a>
      </div>
    `
  }
}
