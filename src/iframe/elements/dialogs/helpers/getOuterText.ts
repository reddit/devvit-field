import {type TemplateResult, html} from 'lit'
import type {Level} from '../../../../shared/types/level'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../../../shared/types/message'

const HINT_TEXT = {
  0: ['However...', `There's something you might like to see`],
  1: ['Interesting...', `There's something else you should know`],
  2: [`So close. Or so far? Let's measure`],
  3: ['Was that on purpose?', 'We have something else to show you'],
  4: ['+1 point for your team!'], //TODO: update copy. need to know team & teamPoints (standings)
}

export function getOuterText(
  msg: DialogMessage | ChallengeCompleteMessage | undefined,
  currentLevel: Level,
  playerClaimedCells: number | undefined,
): TemplateResult {
  if (!msg) {
    return html`
      <span>No message.</span>
    `
  }
  switch (msg.type) {
    case 'ChallengeComplete': //TODO: remove, this is handled by Dialog code ChallengeEndedStay
      if (!playerClaimedCells) {
        return html``
      }
      return html`
        <span class="caps">You claimed</span>
        <span>${playerClaimedCells}</span>
        <span class="caps">boxes without getting banned</span>
        `
    case 'Dialog': {
      const sentences: string[] = HINT_TEXT[currentLevel] ?? HINT_TEXT[0]

      switch (msg.code) {
        case 'ClaimedABanBox':
          return html`
            <span class="caps message">${msg?.message}</span>
            ${sentences.map(sentence => html`<span class="small-text">${sentence}</span>`)}
          `
        case 'WrongLevelBanned':
          return html`
            <span class="caps">YOUR TEAM NEEDS YOU HERE:</span>
          `
        case 'GlobalPointClaimed':
          //TODO: add team banner here
          return html`
            <span class="caps">You earned a point for your team!</span>
          `
        case 'ChallengeEndedStay':
          if (!playerClaimedCells) {
            return html``
          }
          return html`
            <span class="caps">You claimed</span>
            <span>${playerClaimedCells}</span>
            <span class="caps">boxes without getting banned</span>
          `
        default:
          return html``
      }
    }
    default:
      return html``
  }
}
