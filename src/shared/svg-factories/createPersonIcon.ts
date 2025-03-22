import {type Team, teamColor} from '../team'
import {cssHex} from '../theme'

export function createPersonIcon(team: Team): string {
  return `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 0H8V1H9V5H8V6H4V5H3V1H4V0Z M1 7H11V8H12V12H0V8H1V7Z" fill="${cssHex(teamColor[team])}"/></svg>`
}
