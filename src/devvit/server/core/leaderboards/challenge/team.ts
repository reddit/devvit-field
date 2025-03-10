import {type Team, teams} from '../../../../../shared/team'

export function parseTeam(teamString: string): Team {
  const teamNumber = parseInt(teamString, 10) as Team
  if (!teams.includes(teamNumber)) {
    throw Error(`"${teamString}" not a valid team`)
  }
  return teamNumber
}
