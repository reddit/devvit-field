import {type Team, teamColor} from '../team'
import {cssHex, paletteBlack, paletteTint60} from '../theme'

export function createTeamBadgeBackground(team: Team, width: number): string {
  const height = 38 // badgeHeight = 32;

  const background = `<path d="M3 9h3v-3h3v-3h${width - 18}v3h3v3h3v20h-3v3h-3v3h-${width - 18}v-3h-3v-3h-3v-20Z" fill="${cssHex(teamColor[team])}" />`

  const highlight = `<path d="M3 9h3v-3h3v-3h${width - 18}v3h3v3h3v20h-3v3h-3v3h-${width - 18}v-3h-3v-3h-3v-20ZM6 12h3v-3h3v-3h${width - 24}v3h3v3h3v14h-3v3h-3v3h-${width - 24}v-3h-3v-3h-3v-14Z" fill="${cssHex(paletteTint60)}" fill-rule="evenodd" clip-rule="evenodd" />`

  const shadow = `<path d="M12 35h${width - 21}v-3h3v-3h3v-17h3v20h-3v3h-3v3h-${width - 18}" fill="${cssHex(paletteBlack)}" />`

  // Drawing Order for Layers
  const drawOrder = [background, highlight, shadow]

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">${drawOrder.join('')}</svg>`
}
