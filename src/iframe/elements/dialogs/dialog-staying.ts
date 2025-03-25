import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssHex, fontMSize, spacePx} from '../../../shared/theme.ts'
import {cssReset} from '../css-reset.ts'

import {padNumber} from '../../../shared/format.ts'
import {
  lineBreakToken,
  localize,
  variableStartToken,
} from '../../../shared/locale.ts'
import {type Team, teamTitleCase} from '../../../shared/team.ts'
import {type Level, levelHighlightColor} from '../../../shared/types/level.ts'

declare global {
  interface HTMLElementTagNameMap {
    'dialog-staying': DialogStaying
  }
}

@customElement('dialog-staying')
export class DialogStaying extends LitElement {
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
  
      .my-points {
        font-size: 32px;
        color: var(--dialog-team-base-color);
      }
  
      .team {
        color: var(--color-white);
        margin-top: -4px;
      }
  
      h1 {
        font-size: ${fontMSize}px;
        flex-grow: 0;
      }`

  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({type: Number}) accessor roundNumber: number = 0
  @property({type: Number}) accessor team: Team = 0
  @property({type: Number}) accessor myPoints: number = 0
  @property({attribute: false}) accessor buttonHandler: () => void = () => {}

  protected override render(): TemplateResult {
    this.style.setProperty(
      '--dialog-team-base-color',
      cssHex(levelHighlightColor[this.subLvl ?? 0]),
    )

    // Parse and hydrate the localized title string.
    const title: string[] = []
    const lines = localize('staying-dialog-title').split(lineBreakToken)

    for (const line of lines) {
      const containesTokens = line.includes(variableStartToken)

      if (containesTokens) {
        // if the line contains a token (e.g. {0}), wrap the token in a span element, and replace the contents with a dynamic value.
        const words = line.split(' ')
        const tokenIndex = words.findIndex(word =>
          word.startsWith(variableStartToken),
        )
        if (tokenIndex !== -1) {
          const token = words[tokenIndex]
          let value = ''

          if (token === '{TeamName}') {
            value = teamTitleCase[this.team].toUpperCase()
          }
          if (token === '{RoundNumber}') {
            value = this.roundNumber.toString()
          }
          words[tokenIndex] =
            `<span class="${token === '{TeamName}' ? 'team' : ''}">${value}</span>`
        }
        title.push(`<h1>${words.join(' ')}</h1>`)
      } else {
        title.push(`<h1>${line}</h1>`)
      }
    }

    return html`
        <bf-dialog
          .subLvl=${this.subLvl}
          buttonLabel=${localize('staying-dialog-button-label')}
          buttonLevel=${this.subLvl ?? 0}
          .buttonHandler=${this.buttonHandler}>
          <div class="container">
            <dialog-container .height=${96} .subLvl=${this.subLvl ?? 0}>
              <div .innerHTML=${title.join('')}></div>
            </dialog-container>
            <div class="metadata">
              <p>${localize('staying-dialog-metadata-1')}</p>
              <p class="my-points">${padNumber(this.myPoints, 3)}</p>
              <p>${localize('staying-dialog-metadata-2')}</p>
            </div>
          </div>
        </bf-dialog>`
  }
}
