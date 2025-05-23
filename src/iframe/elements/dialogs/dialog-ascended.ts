import {
  type CSSResultGroup,
  LitElement,
  type TemplateResult,
  css,
  html,
} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {cssHex, fontMSize} from '../../../shared/theme.ts'
import {cssReset} from '../css-reset.ts'

import {
  lineBreakToken,
  localize,
  variableStartToken,
} from '../../../shared/locale.ts'
import {type Team, teamTitleCase} from '../../../shared/team.ts'
import {type Level, levelHighlightColor} from '../../../shared/types/level.ts'

declare global {
  interface HTMLElementTagNameMap {
    'dialog-ascended': DialogAscended
  }
}

@customElement('dialog-ascended')
export class DialogAscended extends LitElement {
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

    .team {
      color: var(--color-white);
    }

    h1 {
      color: var(--color-theme-light);
      font-size: ${fontMSize}px;
      flex-grow: 0;
    }`

  @property({type: Number}) accessor subLvl: Level | undefined = 0
  @property({type: Number}) accessor team: Team = 0
  @property({attribute: false}) accessor buttonHandler: () => void = () => {}

  protected override render(): TemplateResult {
    this.style.setProperty(
      '--dialog-team-base-color',
      cssHex(levelHighlightColor[this.subLvl ?? 0]),
    )

    // Parse and hydrate the localized title string.
    const title: string[] = []
    const lines = localize('ascension-dialog-title').split(lineBreakToken)
    for (const line of lines) {
      const containesToken = line.includes(variableStartToken)
      if (containesToken) {
        const words = line.split(' ')
        const tokenIndex = words.findIndex(word =>
          word.startsWith(variableStartToken),
        )
        if (tokenIndex !== -1) {
          const value = teamTitleCase[this.team].toUpperCase()
          words[tokenIndex] = `<span class="team">${value}</span>`
        }
        title.push(`<h1>${words.join(' ')}</h1>`)
      } else {
        title.push(`<h1>${line}</h1>`)
      }
    }

    return html`
      <bf-dialog
        .subLvl=${this.subLvl}
        buttonLabel=${localize('ascension-dialog-button-label')}
        buttonLevel=${this.subLvl ?? 0}
        .buttonHandler=${this.buttonHandler}>
        <div class="container">
          <dialog-container
            .height=${200} 
            .subLvl=${this.subLvl ?? 0}>
            <div .innerHTML=${title.join('')}></div>
          </dialog-container>
        </div>
      </bf-dialog>`
  }
}
