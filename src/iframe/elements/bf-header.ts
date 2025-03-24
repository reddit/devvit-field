import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {fontSSize, radiusPx, spacePx} from '../../shared/theme.ts'
import type {XY} from '../../shared/types/2d.ts'
import {cssReset} from './css-reset.ts'

import './bf-leaderboard.ts'

import {abbreviateNumber} from '../../shared/format.ts'

declare global {
  interface HTMLElementEventMap {
    claim: CustomEvent<XY>
    'open-leaderboard': CustomEvent<undefined>
  }
  interface HTMLElementTagNameMap {
    'bf-header': BFHeader
  }
}

@customElement('bf-header')
export class BFHeader extends LitElement {
  static override readonly styles: CSSResultGroup = css`
    ${cssReset}

    .Field {color: var(--color-field-light); border-color: var(--color-field-light);}
    .BannedField {color: var(--color-banned-field-light);}
    .VeryBannedField {color: var(--color-very-banned-field-light);}
    .BananaField {color: var(--color-banana-field-light);}

    :host {
      display: flex;
      flex-direction: column;
      gap: ${spacePx / 4}px;
      background-color: var(--color-black);
      padding: 0 ${spacePx}px;
      border-top-left-radius: ${radiusPx * 2}px;
      border-top-right-radius: ${radiusPx * 2}px;
      border-width: 1px;
      border-style: solid;
      position: relative;
      width: 100%;
      height: 48px;
      justify-content: center;
      flex-shrink: 0;
      flex-grow: 0;
    }

    .header-top {
      display: flex;
      width: 100%;
      justify-content: space-between;
    }
    .title {
      font-size: 16px;
    }

    .help {
      height: 16px;
      width: 16px;
      text-align: center;
      border-radius: 100%;
      border-style: solid;
      border-width: 1px;
      border-color: var(--color-tint-60);
      color: var(--color-tint-60);
      font-size: ${fontSSize}px;
    }

    .stats {
      display: flex;
      flex-direction: row;
      gap: 12px;
      width: 100%;
      font-size: 12px;
      line-height: 12px;
    }

    .stat {
      display: flex;
      flex-direction: row;
      gap: ${spacePx / 2}px;
      align-content: center;
    }
  `

  @property() accessor sub: string | undefined
  @property({type: Number}) accessor players: number = 0
  @property({type: Number}) accessor fieldBans: number = 0
  @property({type: Number}) accessor fieldBoxes: number = 0
  /** Boxes scored. */
  @property({type: Number}) accessor flamingo: number = 0
  @property({type: Number}) accessor juiceBox: number = 0
  @property({type: Number}) accessor lasagna: number = 0
  @property({type: Number}) accessor sunshine: number = 0

  protected override render(): TemplateResult {
    return html`
        <h2 class='title'>${this.sub}</h2>

      <div class='stats'>
        <div class="stat">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.99995 0V0.374034H6.74993V0.750016H6.37397V1.12405H5.24996V1.50003H4.49997V1.87601L4.124 1.87407V2.62408H3.74998V3.3741H3.37401V4.5001H2.99999V4.12411H2.62402V3.00006H2.25V2.64551L2.62402 2.62408V1.50003H2.99999V0.750016H3.37596L3.37401 0.374034H4.124V0H5.99995Z M0.374021 8.25005H0V10.1241H1.12401V9.3741H1.49998V9.00006H1.874V8.25005H2.24997V7.87407H2.99996V7.50003H3.74995V7.12405H4.49993V6.75002H4.12397L4.12591 6.37403H3.74995V6H2.62399V6.37403H1.874V6.75002H1.12401L1.12596 7.12405H0.749989V7.50003H0.374021V8.25005Z M9.74988 8.25001V7.87402H4.12399V8.25001H3.374L3.37595 8.62404H2.99998V9.00002H2.62401L2.62596 9.37406H2.24999V9.75004H1.87402V12.0001H11.6239V11.6241H11.9999V10.1241H11.6239V9.37406H11.2499V9.00002H10.8739V8.62404H10.4999V8.25001H9.74988Z M7.87299 2.24952V1.87354H5.62302V2.24952H5.249V2.6255L4.87304 2.62355L4.87498 2.99953H4.49902V3.74955H4.12305V5.24958H4.49902V5.9996H4.87498L4.87304 6.37363H5.249V6.74962H5.62302V7.12365H7.87299V6.74962H8.62298V6.37363H8.99895V5.9996H9.37297V4.8736H9.74894V4.12358H9.37297V2.99953H8.99895V2.62355L8.62298 2.6255V2.24952H7.87299Z" fill="currentColor"/>
          </svg>
          <span>${abbreviateNumber(this.players)}</span>
        </div>

        <div class="stat">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.42877 1.2002H2.57162C1.8142 1.2002 1.2002 1.8142 1.2002 2.57162V9.42877C1.2002 10.1862 1.8142 10.8002 2.57162 10.8002H9.42877C10.1862 10.8002 10.8002 10.1862 10.8002 9.42877V2.57162C10.8002 1.8142 10.1862 1.2002 9.42877 1.2002Z" fill="black"/>
            <path d="M2.38672 7.18848H4.78672V9.58848H2.38672V7.18848Z M7.18711 4.78809H4.78711L4.78672 7.18848L7.18711 7.18809V4.78809Z M7.1875 2.38818H9.5875V4.78818L7.18711 4.78809L7.1875 2.38818Z M4.78672 2.38818H2.38672V4.78818L4.78711 4.78809L4.78672 2.38818Z M7.18711 7.18809L9.5875 7.18848V9.58848H7.1875L7.18711 7.18809Z M9.42857 0H2.57143C1.15127 0 0 1.15127 0 2.57143V9.42857C0 10.8487 1.15127 12 2.57143 12H9.42857C10.8487 12 12 10.8487 12 9.42857V2.57143C12 1.15127 10.8487 0 9.42857 0ZM9.42857 1.2H2.57143C1.81401 1.2 1.2 1.81401 1.2 2.57143V9.42857C1.2 10.186 1.81401 10.8 2.57143 10.8H9.42857C10.186 10.8 10.8 10.186 10.8 9.42857V2.57143C10.8 1.81401 10.186 1.2 9.42857 1.2Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
          </svg>  
          <span>${abbreviateNumber(this.fieldBans)}</span>
        </div>

        <bf-leaderboard
            bans='${this.fieldBans}'
            boxes='${this.fieldBoxes}'
            flamingo='${this.flamingo}'
            juiceBox='${this.juiceBox}'
            lasagna='${this.lasagna}'
            sunshine='${this.sunshine}'
        ></bf-leaderboard>
      </div>`
  }
}
