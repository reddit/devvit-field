import {expect, it} from 'vitest'
import {getTeamFromUserId} from './team'
import {USER_IDS} from './test-utils'

it('getTeamFromUserId - should return the team given the userId', () => {
  expect(getTeamFromUserId(USER_IDS.TEAM_0_PLAYER_1)).toBe(0)
  expect(getTeamFromUserId(USER_IDS.TEAM_0_PLAYER_2)).toBe(0)
  expect(getTeamFromUserId(USER_IDS.TEAM_1_PLAYER_1)).toBe(1)
  expect(getTeamFromUserId(USER_IDS.TEAM_1_PLAYER_2)).toBe(1)
  expect(getTeamFromUserId(USER_IDS.TEAM_2_PLAYER_1)).toBe(2)
  expect(getTeamFromUserId(USER_IDS.TEAM_2_PLAYER_2)).toBe(2)
  expect(getTeamFromUserId(USER_IDS.TEAM_3_PLAYER_1)).toBe(3)
  expect(getTeamFromUserId(USER_IDS.TEAM_3_PLAYER_2)).toBe(3)
})
