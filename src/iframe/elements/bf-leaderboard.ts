import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {fontSSize, radiusPx, spacePx} from '../../shared/theme.ts'
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
      flex-direction: column;
      width: 100%;
    }

    .bar {
      height: ${fontSSize}px;
      width: 100%;
    }
    .bar > div {
      height: 100%;
      border-end-end-radius: ${radiusPx}px;
      border-start-end-radius: ${radiusPx}px;
      transition-property: width;
      transition-duration: 0.3s;
      transition-timing-function: ease;
    }

    .chart { border-collapse: collapse; }
    .chart > tr {
      padding-inline-start: 0;
      padding-inline-end: 0;
      padding-block-start: 0;
      padding-block-end: 0;
    }

    .percent {
      font-size: ${fontSSize}px;
      text-align: end;
      width: auto;
      padding-inline-end: ${spacePx}px;
    }

    .flamingo { color: var(--color-flamingo); }
    .flamingo .bar > div {
      background-color: var(--color-flamingo);
    }
    .juice-box { color: var(--color-juice-box); }
    .juice-box .bar > div {
      background-color: var(--color-juice-box);
    }
    .lasagna { color: var(--color-lasagna); }
    .lasagna .bar > div {
      background-color: var(--color-lasagna);
    }
    .sunshine { color: var(--color-sunshine); }
    .sunshine .bar > div {
      background-color: var(--color-sunshine);
    }
  `

  @property({type: Number}) accessor bans: number = 0
  @property({type: Number}) accessor boxes: number = 0
  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0

  protected override render(): TemplateResult {
    const boxes = this.boxes - this.bans || 1
    const flamingo = (this.flamingo / boxes) * 100
    const juiceBox = (this.juiceBox / boxes) * 100
    const lasagna = (this.lasagna / boxes) * 100
    const sunshine = (this.sunshine / boxes) * 100
    return html`
      <table class='chart'>
        <tr class='flamingo'>
          <td class='percent'>${flamingo.toFixed(1)}%</td>
          <td class='bar'><div style='width: ${flamingo}%;'></div></td>
        </tr>
        <tr class='juice-box'>
          <td class='percent'>${juiceBox.toFixed(1)}%</td>
          <td class='bar'><div style='width: ${juiceBox}%;'></div></td>
        </tr>
        <tr class='lasagna'>
          <td class='percent'>${lasagna.toFixed(1)}%</td>
          <td class='bar'><div style='width: ${lasagna}%;'></div></td>
        </tr>
        <tr class='sunshine'>
          <td class='percent'>${sunshine.toFixed(1)}%</td>
          <td class='bar'><div style='width: ${sunshine}%;'></div></td>
        </tr>
      </table>
    `
  }
}
