import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {fontSSize, spacePx, thinStroke} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-leaderboard': BFLeaderboard
  }
}

@customElement('bf-leaderboard')
export class BFLeaderboard extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: flex;
      flex-direction: row;
      column-gap: ${spacePx}px;
      width: 100%;
      align-items: center;
    }

    .label {
      font-size: ${fontSSize}px;
      color: var(--color-theme-light);
    }

    .board {
      display: flex;
      height: 12px;
      column-gap: ${spacePx / 4}px;
      width: 100%;
      background-color: var(--color-tint-19);
    }

    .bar {
      height: 100%;
      transition-property: width;
      transition-duration: 0.3s;
      transition-timing-function: ease-out;
      min-width: ${thinStroke}px;
    }

    .flamingo {background-color: var(--color-flamingo);}
    .juice-box {background-color: var(--color-juice-box);}
    .lasagna {background-color: var(--color-lasagna);}
    .sunshine {background-color: var(--color-sunshine);}
  `

  @property({type: Number}) accessor bans: number = 0
  @property({type: Number}) accessor boxes: number = 0
  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0

  protected override render(): TemplateResult {
    const boxes = this.boxes || 1 // don't want to divide by zero
    const claimed = this.flamingo + this.juiceBox + this.lasagna + this.sunshine
    const flamingo = (this.flamingo / boxes) * 100
    const juiceBox = (this.juiceBox / boxes) * 100
    const lasagna = (this.lasagna / boxes) * 100
    const sunshine = (this.sunshine / boxes) * 100

    const percentageClaimed = (claimed / boxes) * 100

    return html`
      <div class="label">${`${percentageClaimed.toFixed(2)}`}%</div>
      <div class='board'>
        <div class='bar flamingo' style='width: ${flamingo}%;'></div>
        <div class='bar juice-box' style='width: ${juiceBox}%;'></div>
        <div class='bar lasagna' style='width: ${lasagna}%;'></div>
        <div class='bar sunshine' style='width: ${sunshine}%;'></div>
      </div>
    `
  }
}
