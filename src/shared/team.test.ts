import {expect, it} from 'vitest'
import {getTeamFromUserId} from './team'

it('getTeamFromUserId - should return the team given the userId', () => {
  expect(getTeamFromUserId('t2_x23cx2323x23x2x')).toBe(0)
  expect(getTeamFromUserId('t2_x23cxx')).toBe(1)
  expect(getTeamFromUserId('t2_asdasdc')).toBe(2)
  expect(getTeamFromUserId('t2_bbbbbbbb')).toBe(3)
})
