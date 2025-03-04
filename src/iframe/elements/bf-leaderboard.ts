import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {
  cssHex,
  paletteFlamingo,
  paletteJuiceBox,
  paletteLasagna,
  paletteShade60,
  paletteSunshine,
  radiusPx,
  spacePx,
} from '../../shared/theme.ts'
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
      gap: ${spacePx / 2}px;
      padding-inline-start: ${spacePx / 2}px;
      padding-inline-end: ${spacePx / 2}px;
      background-color: ${unsafeCSS(cssHex(paletteShade60))};
      border-radius: ${radiusPx}px;
    }

    .bar {
      height: 7.5px;
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

    .chart > tr {
      padding-inline-start: 0;
      padding-inline-end: 0;
      padding-block-start: 0;
      padding-block-end: 0;
    }

    .percent {
      font-size: 7px;
      text-align: end;
      width: auto;
    }

    .flamingo { color: ${unsafeCSS(cssHex(paletteFlamingo))}; }
    .flamingo .bar > div {
      background-color: ${unsafeCSS(cssHex(paletteFlamingo))};
    }
    .juice-box { color: ${unsafeCSS(cssHex(paletteJuiceBox))}; }
    .juice-box .bar > div {
      background-color: ${unsafeCSS(cssHex(paletteJuiceBox))};
    }
    .lasagna { color: ${unsafeCSS(cssHex(paletteLasagna))}; }
    .lasagna .bar > div {
      background-color: ${unsafeCSS(cssHex(paletteLasagna))};
    }
    .sunshine { color: ${unsafeCSS(cssHex(paletteSunshine))}; }
    .sunshine .bar > div {
      background-color: ${unsafeCSS(cssHex(paletteSunshine))};
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
