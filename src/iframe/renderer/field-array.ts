import type {Team} from '../../shared/team.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {FieldConfig} from '../../shared/types/field-config.ts'

/**
 * --sp vbtt
 *
 *  s: Select overlay.
 *  p: Pending overlay.
 *  v: Visible / hidden.
 *  b: Ban overlay.
 * tt: Background color; 0-3 team.
 */
export const fieldArraySelectMask: number = 0b0000_0001
export const fieldArraySelectOn: number = 0b0000_0001
export const fieldArraySelectOff: number = 0b0000_0000
export const fieldArraySelectShift: number = 5
export const fieldArrayPendMask: number = 0b0000_0001
export const fieldArrayPendOn: number = 0b0000_0001
export const fieldArrayPendOff: number = 0b0000_0000
export const fieldArrayPendShift: number = 4
export const fieldArrayVisibleMask: number = 0b0000_0001
export const fieldArrayVisibleOn: number = 0b0000_0001
export const fieldArrayVisibleOff: number = 0b0000_0000
export const fieldArrayVisibleShift: number = 3
export const fieldArrayBanMask: number = 0b0000_0001
export const fieldArrayBanOn: number = 0b0000_0001
export const fieldArrayBanOff: number = 0b0000_0000
export const fieldArrayBanShift: number = 2
export const fieldArrayTeamMask: number = 0b0000_0011
export const fieldArrayTeamShift: number = 0

export function fieldArrayIndex(
  config: Readonly<FieldConfig>,
  xy: Readonly<XY>,
): number {
  return xy.y * config.wh.w + xy.x
}

export function fieldArraySetSelected(
  field: Uint8Array,
  i: number,
  selected: boolean,
): void {
  field[i] =
    (field[i]! & ~(fieldArraySelectMask << fieldArraySelectShift)) |
    ((selected ? fieldArraySelectOn : fieldArraySelectOff) <<
      fieldArraySelectShift)
}

export function fieldArrayGetPending(field: Uint8Array, i: number): boolean {
  return (
    ((field[i]! >>> fieldArrayPendShift) & fieldArrayPendMask) ===
    fieldArrayPendOn
  )
}

export function fieldArraySetPending(
  field: Uint8Array,
  i: number,
  pend: boolean,
): void {
  field[i] =
    (field[i]! & ~(fieldArrayPendMask << fieldArrayPendShift)) |
    ((pend ? fieldArrayPendOn : fieldArrayPendOff) << fieldArrayPendShift)
}

export function fieldArrayGetVisible(field: Uint8Array, i: number): boolean {
  return (
    ((field[i]! >>> fieldArrayVisibleShift) & fieldArrayVisibleMask) ===
    fieldArrayVisibleOn
  )
}

export function fieldArraySetVisible(
  field: Uint8Array,
  i: number,
  visible: boolean,
): void {
  field[i] =
    (field[i]! & ~(fieldArrayVisibleMask << fieldArrayVisibleShift)) |
    ((visible ? fieldArrayVisibleOn : fieldArrayVisibleOff) <<
      fieldArrayVisibleShift)
}

export function fieldArraySetBan(
  field: Uint8Array,
  i: number,
  ban: boolean,
): void {
  field[i] =
    (field[i]! & ~(fieldArrayBanMask << fieldArrayBanShift)) |
    ((ban ? fieldArrayBanOn : fieldArrayBanOff) << fieldArrayBanShift)
}

export function fieldArraySetTeam(
  field: Uint8Array,
  i: number,
  team: Team,
): void {
  field[i] =
    (field[i]! & ~(fieldArrayTeamMask << fieldArrayTeamShift)) |
    (team << fieldArrayTeamShift)
}
