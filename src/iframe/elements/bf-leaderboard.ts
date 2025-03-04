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
      border-start-start-radius: ${radiusPx}px;
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

    .flamingo { color: ${unsafeCSS(cssHex(paletteFlamingo))}; }
    .flamingo > .bar {
      background-color: ${unsafeCSS(cssHex(paletteFlamingo))};
    }
    .juice-box { color: ${unsafeCSS(cssHex(paletteJuiceBox))}; }
    .juice-box > .bar {
      background-color: ${unsafeCSS(cssHex(paletteJuiceBox))};
    }
    .lasagna { color: ${unsafeCSS(cssHex(paletteLasagna))}; }
    .lasagna > .bar {
      background-color: ${unsafeCSS(cssHex(paletteLasagna))};
    }
    .sunshine { color: ${unsafeCSS(cssHex(paletteSunshine))}; }
    .sunshine > .bar {
      background-color: ${unsafeCSS(cssHex(paletteSunshine))};
    }
  `

  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0

  protected override render(): TemplateResult {
    const total =
      this.flamingo + this.juiceBox + this.lasagna + this.sunshine || 1
    const flamingo = (this.flamingo / total) * 100
    const juiceBox = (this.juiceBox / total) * 100
    const lasagna = (this.lasagna / total) * 100
    const sunshine = (this.sunshine / total) * 100
    return html`
      <table>
        <tr class='flamingo'>
          <td class='percent'>${flamingo.toFixed(1)}%</td>
          <td class='bar' style='width: ${flamingo}%;'>a</td>
        </tr>
        <tr class='juice-box'>
          <td class='percent'>${juiceBox.toFixed(1)}%</td>
          <td class='bar' style='width: ${juiceBox}%;'>a</td>
        </tr>
        <tr class='lasagna'>
          <td class='percent'>${lasagna.toFixed(1)}%</td>
          <td class='bar' style='width: ${lasagna}%;'>a</td>
        </tr>
        <tr class='sunshine'>
          <td class='percent'>${sunshine.toFixed(1)}%</td>
          <td class='bar' style='width: ${sunshine}%;'>a</td>
        </tr>
      </table>
    `
  }
}
