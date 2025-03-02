import type {Team} from '../../shared/team.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {FieldConfig} from '../../shared/types/field-config.ts'

/**
 * ---- -ccc
 *
 * ccc: color.
 */
export const fieldArrayColorHidden: number = 0
export const fieldArrayColorBan: number = 1
export const fieldArrayColorTeamOffset: number = 2 // 2 - 5.
export const fieldArrayColorPending: number = 6 // For state only.

export function fieldArrayIndex(
  config: Readonly<FieldConfig>,
  xy: Readonly<XY>,
): number {
  return xy.y * config.wh.w + xy.x
}

export function fieldArrayGetPending(field: Uint8Array, i: number): boolean {
  return field[i] === fieldArrayColorPending
}

export function fieldArraySetPending(field: Uint8Array, i: number): void {
  field[i] = fieldArrayColorPending
}

export function fieldArrayGetVisible(field: Uint8Array, i: number): boolean {
  return field[i] !== fieldArrayColorHidden
}

export function fieldArraySetBan(field: Uint8Array, i: number): void {
  field[i] = fieldArrayColorBan
}

export function fieldArraySetTeam(
  field: Uint8Array,
  i: number,
  team: Team,
): void {
  field[i] = fieldArrayColorTeamOffset + team
}
