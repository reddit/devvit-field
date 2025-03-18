import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {fontMSize, spacePx} from '../../../shared/theme.ts'
import {cssReset} from '../css-reset.ts'

import {
  lineBreakToken,
  localize,
  variableStartToken,
} from '../../../shared/locale.ts'
import {type Level, levelPascalCase} from '../../../shared/types/level.ts'

declare global {
  interface HTMLElementTagNameMap {
    'dialog-unauthorized': DialogUnauthorized
  }
}

@customElement('dialog-unauthorized')
export class DialogUnauthorized extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    .container {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .metadata {
      color: var(--color-white);
      flex-grow: 2;
      align-content: center;
      font-size: ${fontMSize}px;
      padding-top: ${spacePx}px;
    }

    h1 {
      font-size: 16px;
      flex-grow: 0;
    }`

  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({type: Number}) accessor buttonLevel: Level = 0
  @property({attribute: false}) accessor buttonHandler: () => void = () => {}

  protected override render(): TemplateResult {
    const words = localize('unauthorized-dialog-button-label').split(' ')
    const tokenIndex = words.findIndex(word =>
      word.startsWith(variableStartToken),
    )

    const buttonLabel = [
      ...words.slice(0, tokenIndex),
      `r/${levelPascalCase[this.buttonLevel ?? 0]}`,
      ...words.slice(tokenIndex + 1),
    ].join(' ')

    return html`
      <bf-dialog
        .subLvl=${this.subLvl}
        buttonLevel=${this.buttonLevel}
        buttonLabel=${buttonLabel}
        .buttonHandler=${this.buttonHandler}>
        <div class="container">
          <dialog-container .height=${96} .subLvl=${this.subLvl ?? 0}>
            ${localize(`unauthorized-dialog-level-${this.subLvl ?? 0}`)
              .split(lineBreakToken)
              .map(line => html`<h1>${line}</h1>`)}
          </dialog-container>
        </div>
      </bf-dialog>`
  }
}
