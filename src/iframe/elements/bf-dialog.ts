import {
  type CSSResultGroup,
  LitElement,
  type PropertyValues,
  type TemplateResult,
  css,
  html,
  unsafeCSS,
} from 'lit'
import {customElement, property, query} from 'lit/decorators.js'
import {paletteShade50, radiusPx, spacePx} from '../../shared/theme.ts'
import {cssHex, paletteLightShade} from '../../shared/theme.ts'
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
      box-shadow: 0 ${spacePx / 4}px ${spacePx}px ${unsafeCSS(cssHex(paletteLightShade))};
    }

    dialog::backdrop {
      background-color: ${unsafeCSS(cssHex(paletteShade50))};
    }
  `

  @property({type: Boolean, reflect: true}) accessor open: boolean = false

  @query('dialog') private accessor _dialog!: HTMLDialogElement

  protected override update(props: PropertyValues<this>): void {
    super.update(props)
    if (props.has('open'))
      this.open ? this._dialog.showModal() : this._dialog.close()
  }

  protected override render(): TemplateResult {
    return html`
      <dialog @close="${this.#onClose}">
        <slot></slot>
      </dialog>
    `
  }

  #onClose(): void {
    this.open = false
    this.dispatchEvent(Bubble('close', undefined))
  }
}
