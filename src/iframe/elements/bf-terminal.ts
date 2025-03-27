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
import {radiusPx, spacePx} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {type Level, levelPascalCase} from '../../shared/types/level.ts'
import {Bubble} from './bubble.ts'
import {cssReset} from './css-reset.ts'

import './bf-header.ts'
import './bf-button.ts'
import './bf-footer.ts'
import {hydrateString} from '../../shared/format.ts'
import {localize} from '../../shared/locale.ts'

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
      overflow: hidden;
      padding: ${spacePx / 2}px;
      background-color: var(--color-console);
    }

    main {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      flex-shrink: 1;
      align-items: center;
    }

    bf-header {
      margin-bottom: ${spacePx}px;
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

    .canvas-container {
      position: relative;
      flex-grow: 1;
      flex-shrink: 1;
      width: 100%;
    }

    .canvas-box {
      position: absolute;
      top: 0;
      bottom: 0;
      left: ${spacePx}px;
      right: ${spacePx}px;
      overflow: hidden;
      border-bottom-left-radius: ${radiusPx}px;
      border-bottom-right-radius: ${radiusPx}px;
    }

    .claim-button {
      text-transform: uppercase;
    }

    .terminal {
      display: flex;
      flex-direction: column;
      border-radius: ${radiusPx * 3}px;
      border-width: 1px;
      border-style: solid;
      border-color: var(--color-black);
      align-items: center;
      height: 100%;
      overflow: hidden;
    }

    bf-footer {
      /* Do not rescale. Artwork is vertically static */
      flex-shrink: 0;
      flex-grow: 0;
    }
  `

  @queryAsync('canvas') accessor canvas!: Promise<HTMLCanvasElement>

  @property({type: Number}) accessor bannedPlayers: number = 0
  @property({type: Boolean}) accessor cooldown: boolean = false
  @property({type: Number}) accessor challenge: number | undefined
  @property({type: Number}) accessor fieldBans: number = 0
  @property({type: Number}) accessor fieldBoxes: number = 0
  /** Boxes scored. */
  @property({type: Number}) accessor challengeScoreFlamingo: number = 0
  @property({type: Number}) accessor challengeScoreJuiceBox: number = 0
  @property({type: Number}) accessor challengeScoreLasagna: number = 0
  @property({type: Number}) accessor challengeScoreSunshine: number = 0
  @property({type: Number}) accessor globalScoreFlamingo: number = 0
  @property({type: Number}) accessor globalScoreJuiceBox: number = 0
  @property({type: Number}) accessor globalScoreLasagna: number = 0
  @property({type: Number}) accessor globalScoreSunshine: number = 0
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
      ? this.cooldown
        ? localize('game-claim-button-label-working')
        : hydrateString(localize('game-claim-button-label'), {
            TeamName: this.team,
          })
      : localize('game-claim-button-label-fallback')
    return html`
      <div
        class='terminal ${this.level == null ? '' : levelPascalCase[this.level]}'
        style='pointer-events: ${this.loading ? 'none' : 'initial'}'
      >
        <main>
          <bf-header
            sub='${ifDefined(this.sub)}'
            players='${this.players}'
            fieldBans='${this.fieldBans}'
            fieldBoxes='${this.fieldBoxes}'
            flamingo='${this.challengeScoreFlamingo}'
            juiceBox='${this.challengeScoreJuiceBox}'
            lasagna='${this.challengeScoreLasagna}'
            sunshine='${this.challengeScoreSunshine}'
            x='${this.x}'
            y='${this.y}'
          ></bf-header>


          <div class="canvas-container">
            <div class='canvas-box'>
              <!--- Set tabIndex to propagate key events. -->
              <canvas tabIndex='0'></canvas>
            </div>
          </div>


          <!-- Claim Button -->
          <bf-button
            @click='${() =>
              this.dispatchEvent(
                Bubble('claim', {
                  x: this.x,
                  y: this.y,
                }),
              )}'
            appearance='${ifDefined(this.team)}'
            class='claim-button'
            label='${claim}'
            ?disabled='${!this.team || this.cooldown}'
            style='--width: 256px;'
          ></bf-button>

          <!-- Scoreboard Footer -->
          <bf-footer
            flamingo='${this.globalScoreFlamingo}'
            juiceBox='${this.globalScoreJuiceBox}'
            lasagna='${this.globalScoreLasagna}'
            sunshine='${this.globalScoreSunshine}'
            team='${ifDefined(this.team)}'
          ></bf-footer>
        </main>

      </div>
    `
  }
}
