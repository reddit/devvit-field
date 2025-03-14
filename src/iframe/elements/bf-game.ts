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
import {teamPascalCase} from '../../shared/team.ts'
import {
  cssHex,
  paletteBananaField,
  paletteBananaFieldDark,
  paletteBananaFieldLight,
  paletteBannedField,
  paletteBannedFieldDark,
  paletteBannedFieldLight,
  paletteField,
  paletteFieldDark,
  paletteFieldLight,
  paletteVeryBannedField,
  paletteVeryBannedFieldDark,
  paletteVeryBannedFieldLight,
  paletteWhatIsField,
  paletteWhatIsFieldDark,
  paletteWhatIsFieldLight,
} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../shared/types/message.ts'
import {Game} from '../game/game.ts'
import type {BFTerminal} from './bf-terminal.ts'
import {cssReset} from './css-reset.ts'

import './dialogs/dialog-webgl.ts'
import './dialogs/dialog-ascended.ts'
import './dialogs/dialog-staying.ts'
import './dialogs/dialog-banned.ts'
import './bf-dialog.ts'
import './bf-terminal.ts'

declare global {
  interface HTMLElementEventMap {
    'game-debug': CustomEvent<string>
    'game-ui': CustomEvent<{
      ui: UI
      msg: DialogMessage | ChallengeCompleteMessage | undefined
    }>
    /** Request update; Game properties have changed. */
    'game-update': CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-game': BFGame
  }
}

// to-do: fill out the remaining states.
export type UI =
  | 'DialogMessage'
  | 'Loading'
  /** Promoted, replaying / stuck, or demoted. */
  | 'NoWebGL'
  | 'Playing'
  | 'Scored'

/**
 * Game canvas wrapper and DOM UI. Pass primitive properties to children so
 * that @game-update updates children.
 */
@customElement('bf-game')
export class BFGame extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      display: block;
      height: 100%;
    }

    pre {
      height: 100px;
      overflow: auto;
      background: #fff;
    }

    .box {display: flex; flex-direction: column; height: 100%;}
  `

  @property({reflect: true}) accessor ui: UI = 'Loading'
  @queryAsync('bf-terminal') accessor _terminal!: Promise<BFTerminal>

  #dbgLog: string = ''
  #game: Game = new Game(this)

  // to-do: pass to game.
  async canvas(): Promise<HTMLCanvasElement> {
    const terminal = await this._terminal
    return await terminal.canvas
  }

  override connectedCallback(): void {
    super.connectedCallback()
    void this.#game.start()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.#game.stop()
  }

  protected override render(): TemplateResult {
    // const fieldSize = this.#game.fieldConfig
    //   ? this.#game.fieldConfig.wh.w * this.#game.fieldConfig.wh.h
    //   : 0
    // const visible =
    //   this.#game.fieldConfig && this.#game.visible != null
    //     ? this.#game.visible / fieldSize
    //     : undefined
    // const score =
    //   this.#game.team != null && this.#game.teamBoxCounts
    //     ? this.#game.teamBoxCounts[this.#game.team]
    //     : undefined
    const team =
      this.#game.team == null ? undefined : teamPascalCase[this.#game.team]

    let dialog
    switch (this.ui) {
      case 'Loading':
        // to-do: no background, no nothing.
        break
      case 'Playing':
        break
      case 'DialogMessage':
        // code: 'WrongLevelBanned' 'ChallengeEndedStay'
        // message: 'You are banned from this level.'

        dialog = html`
          <dialog-banned
            subLvl=${1}
            buttonLevel=${3}
            .buttonHandler=${() => {
              this.#game.postMessage({type: 'OnNextChallengeClicked'})
            }}
          >
        </dialog-banned>`

        // dialog = html`
        //   <dialog-staying
        //     subLvl=${1}
        //     roundNumber=${42}
        //     team=${0}
        //     myPoints=${7}
        //     .buttonHandler=${() => {
        //       console.log('to-do: start again')
        //     }}
        //   >
        // </dialog-staying>`

        // dialog = html`<dialog-webgl></dialog-webgl>`

        // dialog = html`
        //   <dialog-ascended
        //     subLvl=${1}
        //     buttonLevel=${2}
        //     .buttonHandler=${() => {
        //       console.log('to-do: navigate to new sub')
        //     }}
        //   >
        // </dialog-ascended>`
        break
      case 'NoWebGL':
        // to-do: replce with dialog-webgl above.
        dialog = html`
          <bf-dialog>
            <h2>Error</h2>
            WebGL 2 support is required to play. Try another device.
          </bf-dialog>
        `
        break
      case 'Scored':
        return html`to-do: fix me.`
      default:
        this.ui satisfies never
    }

    const theme =
      this.#game.sub == null
        ? undefined
        : {
            0: paletteField,
            1: paletteBannedField,
            2: paletteVeryBannedField,
            3: paletteBananaField,
            4: paletteWhatIsField,
          }[this.#game.sub]
    const themeDark =
      this.#game.sub == null
        ? undefined
        : {
            0: paletteFieldDark,
            1: paletteBannedFieldDark,
            2: paletteVeryBannedFieldDark,
            3: paletteBananaFieldDark,
            4: paletteWhatIsFieldDark,
          }[this.#game.sub]
    const themeLight =
      this.#game.sub == null
        ? undefined
        : {
            0: paletteFieldLight,
            1: paletteBannedFieldLight,
            2: paletteVeryBannedFieldLight,
            3: paletteBananaFieldLight,
            4: paletteWhatIsFieldLight,
          }[this.#game.sub]
    const boxes = this.#game.fieldConfig
      ? this.#game.fieldConfig.wh.w * this.#game.fieldConfig.wh.h
      : 0
    return html`
      <div
        class='box'
        style='
          --color-theme: ${theme ? unsafeCSS(cssHex(theme)) : 'initial'};
          --color-theme-dark: ${themeDark ? unsafeCSS(cssHex(themeDark)) : 'initial'};
          --color-theme-light: ${themeLight ? unsafeCSS(cssHex(themeLight)) : 'initial'};
        '
      >
        <bf-terminal
          @game-debug='${(ev: CustomEvent<string>) => {
            this.#dbgLog += `\n${ev.detail}`
            this.requestUpdate()
          }}'
          @game-ui='${(ev: CustomEvent<{ui: UI; msg: DialogMessage}>) => {
            this.ui = ev.detail.ui
          }}'
          @game-update='${() => this.requestUpdate()}'
          @claim='${this.#onClaim}'
          @open-leaderboard='${() => this.#game.postMessage({type: 'OpenLeaderboard'})}'
          bannedPlayers='${this.#game.bannedPlayers}'
          challenge='${ifDefined(this.#game.challenge)}'
          ?online='${this.#game.connected}'
          ?cooldown='${this.#game.isCooldown()}'
          fieldBans='${ifDefined(this.#game.fieldConfig?.bans)}'
          fieldBoxes='${boxes}'
          level='${ifDefined(this.#game.subLvl)}'
          ?loading='${this.ui === 'Loading'}'
          p1Boxes='${ifDefined(this.#game.p1BoxCount)}'
          sub='${ifDefined(this.#game.sub)}'
          players='${this.#game.players}'
          flamingo='${ifDefined(this.#game.teamBoxCounts?.[0])}'
          juiceBox='${ifDefined(this.#game.teamBoxCounts?.[1])}'
          lasagna='${ifDefined(this.#game.teamBoxCounts?.[2])}'
          sunshine='${ifDefined(this.#game.teamBoxCounts?.[3])}'
          team='${ifDefined(team)}'
          x='${this.#game.select.x}'
          y='${this.#game.select.y}'
        ></bf-terminal>
        ${this.#dbgLog ? html`<pre>${this.#dbgLog}</pre>` : ''}
        ${dialog}
      </div>
    `
  }

  #onClaim(ev: CustomEvent<XY>): void {
    this.#game.claimBox(ev.detail)
  }
}
