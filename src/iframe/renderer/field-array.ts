import type {Team} from '../../shared/team.ts'
import type {XY} from '../../shared/types/2d.ts'
import type {FieldConfig} from '../../shared/types/field-config.ts'

/**
 * ---- -ccc
 *
 * ccc: color.
 */
export const fieldArrayColorLoading: number = 0
export const fieldArrayColorHidden: number = 1
export const fieldArrayColorBan: number = 2
export const fieldArrayColorTeamOffset: number = 3 // 3 - 6.

export function fieldArrayIndex(
  config: Readonly<FieldConfig>,
  xy: Readonly<XY>,
): number {
  return xy.y * config.wh.w + xy.x
}

export function fieldArrayIsLoading(field: Uint8Array, i: number): boolean {
  return field[i] === fieldArrayColorLoading
}

export function fieldArraySetHidden(field: Uint8Array, i: number): void {
  field[i] = fieldArrayColorHidden
}

export function fieldArrayIsVisible(field: Uint8Array, i: number): boolean {
  return field[i]! > fieldArrayColorHidden
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
