import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property, queryAsync} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import type {TeamPascalCase} from '../../shared/team.ts'
import {
  cssHex,
  paletteBlack,
  paletteConsole,
  paletteShade60,
  paletteTerminalGreen,
  radiusPx,
  spacePx,
} from '../../shared/theme.ts'
import {fontSSize} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {Level} from '../../shared/types/level.ts'
import {Bubble} from './bubble.ts'
import {cssReset} from './css-reset.ts'

import './bf-button.ts'
import './bf-leaderboard.ts'

declare global {
  interface HTMLElementEventMap {
    claim: CustomEvent<XY>
    'open-leaderboard': CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-terminal': BFTerminal
  }
}

@customElement('bf-terminal')
export class BFTerminal extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: block;
      height: 100%;
      border-radius: 16px;
      border-width: 3px;
      border-color: ${unsafeCSS(cssHex(paletteConsole))};
      border-style: ridge;
      overflow: hidden;
    }

    canvas {
      /* cursor: none; Cursor provided by app. */
      display: none;
      image-rendering: pixelated;
      /* Update on each pointermove *touch* Event like *mouse* Events. */
      touch-action: none;
      outline: none; /* Disable focus outline. */
    }

    .canvas-box {
      height: 100%;
      width: 100%;
      overflow: hidden;
      border-style: solid;
      border-width: 2px;
      border-color: ${unsafeCSS(cssHex(paletteBlack))};
      border-radius: ${radiusPx}px;
    }

    .claim-button {
      text-transform: uppercase;
    }

    .leaderboard-button {
      text-transform: uppercase;
    }

    .panel {
      display: flex;
      font-size: ${fontSSize}px;
      width: 100%;
      padding-block-start: ${spacePx / 2}px;
      padding-block-end: ${spacePx / 2}px;
      padding-inline-start: ${spacePx / 2}px;
      padding-inline-end: ${spacePx / 2}px;
      background-color: ${unsafeCSS(cssHex(paletteShade60))};
      border-radius: ${radiusPx}px;
    }

    .stats {
      display: flex;
      flex-direction: column;
      justify-content: center;

      margin-inline-start: ${spacePx / 2}px;
      white-space: nowrap;
      color: ${unsafeCSS(cssHex(paletteTerminalGreen))};
    }
    .stats .num {
      text-align: end;
    }

    .terminal {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      overflow: hidden;
      background-image: linear-gradient(
        to bottom,
        ${unsafeCSS(cssHex(paletteConsole))} 0,
        ${unsafeCSS(cssHex(paletteConsole))} calc(100% - 48px),
        ${unsafeCSS(cssHex(paletteBlack))} calc(100% - 48px)
      );
      padding-block-start: ${spacePx}px;
      padding-block-end: ${spacePx}px;
      padding-inline-start: ${spacePx}px;
      padding-inline-end: ${spacePx}px;
    }
  `

  @queryAsync('canvas') accessor canvas!: Promise<HTMLCanvasElement>

  @property({type: Number}) accessor bannedPlayers: number = 0
  @property({type: Number}) accessor bans: number = 0
  @property({type: Number}) accessor boxes: number = 0
  @property({type: Boolean}) accessor cooldown: boolean = false
  @property({type: Number}) accessor challenge: number = 0
  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0
  @property({type: Number}) accessor level: Level | undefined
  @property({type: Boolean}) accessor loading: boolean = false
  @property({type: Number}) accessor players: number = 0
  @property() accessor team: TeamPascalCase | undefined
  @property({type: Number}) accessor x: number = 0
  @property({type: Number}) accessor y: number = 0

  protected override render(): TemplateResult {
    // to-do: fix PascalCase team.
    const claim = this.team
      ? `${this.cooldown ? 'Claiming' : 'Claim'} for ${this.team}`
      : 'Claim'
    return html`
      <div
        class='terminal'
        style='pointer-events: ${this.loading ? 'none' : 'initial'}'
      >
        ${
          this.challenge
          //to-do: heading.
        }
        <div class='canvas-box'>
          <!--- Set tabIndex to propagate key events. -->
          <canvas tabIndex='0'></canvas>
        </div>
        <bf-button
          @click='${() => this.dispatchEvent(Bubble('claim', {x: this.x, y: this.y}))}'
          appearance='${ifDefined(this.team)}'
          class='claim-button'
          label='${claim}'
          ?disabled='${!this.team || this.cooldown}'
          style='--width: 256px;'
        ></bf-button>
        <div class='panel'>
          <bf-leaderboard
            bans='${this.bans}'
            boxes='${this.boxes}'
            flamingo='${this.flamingo}'
            juiceBox='${this.juiceBox}'
            lasagna='${this.lasagna}'
            sunshine='${this.sunshine}'
          ></bf-leaderboard>
          <table class='stats'>
            <tr>
              <td class='label'>Banned</td>
              <td class='num'>${this.bannedPlayers}</td>
            </tr>
            <tr>
              <td class='label'>Online</td>
              <td class='num'>${this.players}</td>
            </tr>
          </table>
        </div>
        <bf-button
          @click='${() => this.dispatchEvent(Bubble('open-leaderboard', undefined))}'
          appearance='${ifDefined(this.level)}'
          class='leaderboard-button'
          style='--width: 100%;'
        >
          View leaderboard at r/GamesOnReddit
        </bf-button>
      </div>
    `
  }
}
