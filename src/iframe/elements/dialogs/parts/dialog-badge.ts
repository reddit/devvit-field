import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {createBanBoxBadge} from '../../../../shared/svg-factories/createBanBoxBadge.ts'
import {createDialogBadge} from '../../../../shared/svg-factories/createDialogBadge.ts'
import type {Level} from '../../../../shared/types/level.ts'
import {cssReset} from '../../css-reset.ts'

declare global {
  interface HTMLElementTagNameMap {
    'dialog-badge': OuterContainer
  }
}

@customElement('dialog-badge')
export class OuterContainer extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    .ban-wrapper,
    .non-ban-wrapper {
      position: absolute;
      left: 50%;
      top: 5px;
      transform: translate(-50%, -50%);
    }

    .ban-wrapper svg {
      width: 40px;
      height: 40px;
    }

    .non-ban-wrapper svg {
      width: 26px;
      height: 26px;
    }`

  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({type: Boolean}) accessor banned: boolean = false

  protected override render(): TemplateResult {
    if (this.banned) {
      return html`<div class="ban-wrapper" .innerHTML=${createBanBoxBadge()}></div>`
    }
    return html`<div class="non-ban-wrapper" .innerHTML=${createDialogBadge(this.subLvl ?? 0)}></div>`
  }
}
