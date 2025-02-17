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
  paletteLightGrey,
  paletteSunshine,
  radiusPx,
  spacePx,
} from '../../shared/theme.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'bf-team-chart': BFTeamChart
  }
}

@customElement('bf-team-chart')
export class BFTeamChart extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: block;
      height: 32px;
      background-color: ${unsafeCSS(cssHex(paletteLightGrey))};
    }

    .bar {
      flex-grow: 1;
      border-start-start-radius: ${radiusPx}px;
      border-start-end-radius: ${radiusPx}px;
      transition-property: height;
      transition-duration: 0.3s;
      transition-timing-function: ease;
    }
    .chart {
      display: flex;
      align-items: flex-end;
      height: 100%;
      gap: ${spacePx / 2}px;
      padding-inline-start: ${spacePx / 2}px;
      padding-inline-end: ${spacePx / 2}px;
    }

    .flamingo {
      background-color: ${unsafeCSS(cssHex(paletteFlamingo))};
    }
    .juice-box {
      background-color: ${unsafeCSS(cssHex(paletteJuiceBox))};
    }
    .lasagna {
      background-color: ${unsafeCSS(cssHex(paletteLasagna))};
    }
    .sunshine {
      background-color: ${unsafeCSS(cssHex(paletteSunshine))};
    }
  `

  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0

  protected override render(): TemplateResult {
    // to-do: is this what Knut wants?
    const total = this.flamingo + this.juiceBox + this.lasagna + this.sunshine
    return html`
      <div class='chart'>
        <div
          class="bar flamingo"
          style="height: ${(this.flamingo / total) * 100}%;"
        ></div>
        <div
          class="bar juice-box"
          style="height: ${(this.juiceBox / total) * 100}%;"
        ></div>
        <div
          class="bar lasagna"
          style="height: ${(this.lasagna / total) * 100}%;"
        ></div>
        <div
          class="bar sunshine"
          style="height: ${(this.sunshine / total) * 100}%;"
        ></div>
      </div>
    `
  }
}
