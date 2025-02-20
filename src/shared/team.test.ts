import {expect, it} from 'vitest'
import {getTeamFromUserId} from './team'

it('getTeamFromUserId - should return the team given the userId', () => {
  expect(getTeamFromUserId('t2_1cgemlvzgq')).toBe(2)
})
