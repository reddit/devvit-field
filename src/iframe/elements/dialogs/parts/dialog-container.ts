import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssHex, paletteBlack} from '../../../../shared/theme.ts'
import {cssReset} from '../../css-reset.ts'
import './dialog-badge.ts'
import {createBorderedContainer} from '../../../../shared/svg-factories/createBorderedContainer.ts'
import {createCrtLines} from '../../../../shared/svg-factories/createCrtLines.ts'
import {
  type Level,
  levelHighlightColor,
} from '../../../../shared/types/level.ts'

declare global {
  interface HTMLElementTagNameMap {
    'dialog-container': DialogContainer
  }
}

@customElement('dialog-container')
export class DialogContainer extends LitElement {
  @property({type: Boolean}) accessor showBadge: boolean = false
  @property({type: Boolean}) accessor showLines: boolean = true
  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({type: Number}) accessor width: number = 256
  @property({type: Number}) accessor height: number = 200
  @property({type: String}) accessor backgroundColor: string =
    cssHex(paletteBlack)
  @property({type: String}) accessor borderColor: string = cssHex(
    levelHighlightColor[this.subLvl ?? 0],
  )
  @property({type: String}) accessor verticalAlignment: string = 'center'

  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    :host, .container {
      position: relative;
      width: var(--dialog-width, 256px);
      height: var(--dialog-height, 200px);
      color: var(--color-theme-light);
    }

    .container > * {
      position: absolute;
      inset: 0;
    }

    .content-container {
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-content: var(--dialog-vertical-alignment, center);
    }`

  protected override render(): TemplateResult {
    this.style.setProperty('--dialog-width', `${this.width}px`)
    this.style.setProperty('--dialog-height', `${this.height}px`)
    this.style.setProperty(
      '--dialog-vertical-alignment',
      this.verticalAlignment,
    )

    return html`
      <div class="container">
        <!-- Container Graphic -->
        <div .innerHTML=${createBorderedContainer({
          height: this.height,
          width: this.width,
          borderColor: this.borderColor,
          backgroundColor: this.backgroundColor,
        })}></div>

        <!-- Content Container -->
        <div class="content-container">
          <slot></slot>
        </div>

        <!-- CRT Lines -->
        ${
          this.showLines
            ? html`<div .innerHTML=${createCrtLines({
                height: this.height,
                width: this.width,
              })}></div>`
            : null
        }
      </div>

      <!-- Container Badge -->
      ${this.showBadge ? html`<dialog-badge .subLvl=${this.subLvl}></dialog-badge>` : null}
    `
  }
}
