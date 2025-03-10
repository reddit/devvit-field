import {
  type CSSResultGroup,
  LitElement,
  type PropertyValues,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property, query} from 'lit/decorators.js'
import type {Team} from '../../shared/team.ts'
import {radiusPx, spacePx} from '../../shared/theme.ts'
import type {Level} from '../../shared/types/level.ts'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../shared/types/message.ts'
import type {Game} from '../game/game.ts'
import {Bubble} from './bubble.ts'
import {cssReset} from './css-reset.ts'

declare global {
  interface HTMLElementEventMap {
    close: CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-dialog': BFDialog
  }
}

@customElement('bf-dialog')
export class BFDialog extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host {
      max-width: 320px;
    }

    dialog {
      padding: ${spacePx}px;
      border-radius: ${radiusPx}px;
      border-style: none;
      box-shadow: 0 ${spacePx / 4}px ${spacePx}px var(--color-shade-19);
      background-color: var(--color-console);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: ${spacePx}px;
      height: 100%;
      width: 100%;
      color: var(--color-white);
      font-family: 'Departure Mono', 'Courier New', monospace;
    }

    dialog::backdrop {
      background-color: var(--color-shade-50);
    }

    .caps {
      text-transform: uppercase;
    }

    .promo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${spacePx}px;
      margin-top: 2rem;
      max-width: 200px;
    }
    .logo {
      width: 200px;
    }
  `

  @property({type: Boolean, reflect: true}) accessor open: boolean = false
  @property({type: Object}) accessor msg:
    | DialogMessage
    | ChallengeCompleteMessage
    | undefined
  @property({type: Object}) accessor subLvl: Level | undefined
  @property({type: Array}) accessor winners: Team[] | undefined

  @query('dialog') private accessor _dialog!: HTMLDialogElement

  protected override update(props: PropertyValues<this>): void {
    super.update(props)
    if (props.has('open'))
      this.open ? this._dialog.showModal() : this._dialog.close()
  }

  protected override render(): TemplateResult {
    return html`
      <dialog @close='${this.#onClose}'>
        <outer-container .msg=${this.msg}> .winners=${this.winners}</outer-container>

        <slot></slot>

        <div class="promo">
          <span class="caps">Brought to you by</span>
          <img
            src="/assets/games-on-reddit-logo.svg"
            alt="games on reddit logo"
           class="logo"
          />
        </div>
      </dialog>
    `
  }

  #onClose(): void {
    this.open = false
    this.dispatchEvent(Bubble('close', undefined))
  }
}
