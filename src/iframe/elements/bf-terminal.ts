import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property, queryAsync} from 'lit/decorators.js'
import {ifDefined} from 'lit/directives/if-defined.js'
import type {TeamPascalCase} from '../../shared/team.ts'
import {fontMSize, radiusPx, spacePx} from '../../shared/theme.ts'
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
      border-color: var(--color-console);
      border-style: ridge;
      overflow: hidden;
    }

    canvas {
      /* cursor: none; Cursor provided by app. */
      cursor: pointer;
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
      border-color: var(--color-black);
      border-radius: ${radiusPx}px;
    }

    .claim-button {
      text-transform: uppercase;
    }

    .header {
      display: flex;
      flex-direction: column;
      background-color: var(--color-black);
      padding-block-start: ${spacePx / 2}px;
      padding-block-end: ${spacePx / 2}px;
      padding-inline-start: ${spacePx / 2}px;
      padding-inline-end: ${spacePx / 2}px;
      position: relative;
      width: 100%;
    }
    .header-top {
      display: flex;
      width: 100%;
    }
    .title {flex-grow:1; color: var(--color-terminal-green);}
    .challenge {color: var(--color-white);}
    .header-bottom {
      display: flex;
      width: 100%;
    }
    .status {color: var(--color-grey); font-size: ${fontMSize}px; flex-grow: 1;}
    .your-boxes-title {
      color: var(--color-bland-blue);
      text-transform: uppercase;
      text-decoration: underline;
    }
    .your-boxes-num {color: var(--color-bland-blue);}
    .coords {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
      color: var(--color-terminal-green);
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
      background-color: var(--color-shade-60);
      border-radius: ${radiusPx}px;
    }

    .stats {
      display: flex;
      flex-direction: column;
      justify-content: center;

      margin-inline-start: ${spacePx / 2}px;
      white-space: nowrap;
      color: var(--color-terminal-green);
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
        var(--color-console) 0,
        var(--color-console) calc(100% - 48px),
        var(--color-black) calc(100% - 48px)
      );
      padding-block-start: ${spacePx}px;
      padding-block-end: ${spacePx}px;
      padding-inline-start: ${spacePx}px;
      padding-inline-end: ${spacePx}px;
    }
  `

  @queryAsync('canvas') accessor canvas!: Promise<HTMLCanvasElement>

  @property({type: Number}) accessor bannedPlayers: number = 0
  @property({type: Boolean}) accessor cooldown: boolean = false
  @property({type: Number}) accessor challenge: number | undefined
  @property({type: Number}) accessor fieldBans: number = 0
  @property({type: Number}) accessor fieldBoxes: number = 0
  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0
  @property({type: Number}) accessor level: Level | undefined
  @property({type: Boolean}) accessor loading: boolean = false
  @property({type: Boolean}) accessor online: boolean = false
  @property({type: Number}) accessor p1Boxes: number = 0
  @property({type: Number}) accessor players: number = 0
  @property() accessor sub: string | undefined
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
        <div class='header'>
          <div class='header-top'>
            <h2 class='title'>${this.sub}&nbsp;${this.challenge == null ? '' : html`<span class='challenge'>#${this.challenge}</span>`}</h2>
            <div class='your-boxes-title'>your boxes</div>
          </div>
          <div class='header-bottom'>
            <div class='status'>${this.online ? html`&nbsp;` : '• Offline'}</div>
            <div class='your-boxes-num'>${this.p1Boxes}</div>
          </div>
          <div class='coords'>(${this.x.toString().padStart(4, '0')}, ${this.y.toString().padStart(4, '0')})</div>
        </div>
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
            bans='${this.fieldBans}'
            boxes='${this.fieldBoxes}'
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
