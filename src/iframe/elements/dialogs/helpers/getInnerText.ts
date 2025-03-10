import {type TemplateResult, html} from 'lit'
import {type Team, teamTitleCase} from '../../../../shared/team'
import type {
  ChallengeCompleteMessage,
  DialogMessage,
} from '../../../../shared/types/message'

const STILL_BANNED_TEXT = {
  0: ['Nice try.', 'But you are still banned.'],
  1: ['Hi, friend. You’re still banned in this sub.'],
  2: ['Blessed be the banned.', 'That’s you.'],
  3: ['Yup...still banned.'],
  4: ['???'],
}

export function getInnerText(
  msg: DialogMessage | ChallengeCompleteMessage | undefined,
  winners: Team[] | undefined,
): TemplateResult {
  if (!msg) {
    return html`
      <span>No message.</span>
    `
  }

  let winningTeamName = ''
  if (winners?.[0]) {
    winningTeamName = teamTitleCase[winners[0]]
  }
  switch (msg.type) {
    case 'ChallengeComplete': //TODO: remove, this is handled by Dialog code ChallengeEndedStay
      return html`
        <span class="medium-text white">This round has ended.</span>
        <span class="caps medium-text white">Team ${winningTeamName}</span>
        <span class="medium-text white">claimed the Field</span>
        `
    case 'Dialog':
      switch (msg.code) {
        case 'ChallengeEndedAscend':
          return html`
              <span class="caps medium-text white">Team ${winningTeamName}</span>
              <span class="medium-text">claimed this round. As a surviving participant, you are invited to ascend upward!</span>
              `
        case 'ClaimedABanBox':
          return html`
            <span class="caps">You claimed a ban box!</span>
          `
        case 'WrongLevelBanned': {
          const currentLevel: keyof typeof STILL_BANNED_TEXT = 0 // Define currentLevel with a valid key
          const sentences: string[] = STILL_BANNED_TEXT[currentLevel] || [
            `Default: You're not allowed here`,
          ]
          return html`
            ${sentences.map(sentence => html`<span class="medium-text">${sentence}</span>`)}
          `
        }
        case 'ChallengeEndedStay':
          return html`
        <span class="medium-text white">This round has ended.</span>
        <span class="caps medium-text white">Team ${winningTeamName}</span>
        <span class="medium-text white">claimed the Field</span>
        `
        case 'GlobalPointClaimed':
          return html`
            <span class="caps">Congratulations!</span>
          `
        default:
          return html`
          <span class="medium-text white">No msg.code</span>`
      }
    default:
      return html`
                <span class="medium-text white">No msg</span>`
  }
}
