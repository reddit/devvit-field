import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssHex, spacePx} from '../../shared/theme.ts'
import {type Level, levelShadowColor} from '../../shared/types/level.ts'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../shared/types/message.ts'
import {cssReset} from './css-reset.ts'

import './dialogs/parts/dialog-container.ts'
import './dialogs/parts/dialog-marketing.ts'

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
      position: absolute;
      inset: 0;
      padding: ${spacePx}px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background-color: var(--color-shade-80);
      color: var(--color-white);
    }

    div {
      margin-top: ${spacePx}px;
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    bf-button {
      margin-top: ${spacePx * 2}px;
    }
  `

  @property({type: Object}) accessor msg:
    | DialogMessage
    | ChallengeCompleteMessage
    | undefined

  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({type: Number}) accessor buttonLevel: Level = 0
  @property({type: Boolean}) accessor showButton: boolean = true
  @property({type: String}) accessor buttonLabel: string = 'OK'
  @property({type: Boolean}) accessor showMarketing: boolean = true
  @property({attribute: false}) accessor buttonHandler: () => void = () => {}

  protected override render(): TemplateResult {
    const height = 240
    const width = 288
    return html`
      <dialog-container
        showBadge
        .showLines=${false}
        .subLvl=${this.subLvl}
        height=${height}
        width=${width}
        verticalAlignment="top"
        backgroundColor=${cssHex(levelShadowColor[this.subLvl ?? 0])}>
        <div>
          <slot></slot>
        </div>
      </dialog-container>

      <!-- Primary Button -->
      ${
        this.showButton
          ? html`
          <bf-button
            appearance=${this.buttonLevel}
            @click=${this.buttonHandler}>
          ${this.buttonLabel}
          </bf-button>`
          : null
      }

      <!-- r/GamesOnRedit Marketing -->
      ${
        this.showMarketing
          ? html`
          <dialog-marketing .subLvl=${this.subLvl}></dialog-marketing>`
          : null
      }
    `
  }
}
