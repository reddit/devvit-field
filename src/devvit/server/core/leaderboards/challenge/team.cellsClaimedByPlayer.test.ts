import {expect} from 'vitest'
import {USER_IDS} from '../../../../../shared/test-utils'
import type {T2} from '../../../../../shared/types/tid'
import {DevvitTest} from '../../_utils/DevvitTest'
import {
  teamStatsByPlayerCellsClaimedForMember,
  teamStatsByPlayerCellsClaimedGet,
  teamStatsByPlayerCellsClaimedIncrementForMember,
} from './team.cellsClaimedByPlayer'

DevvitTest.it('should increment, and get challenge stats', async ctx => {
  await expect(
    teamStatsByPlayerCellsClaimedForMember({
      redis: ctx.redis,
      challengeNumber: 0,
      member: USER_IDS.TEAM_0_PLAYER_1,
    }),
  ).resolves.toBe(undefined)

  await teamStatsByPlayerCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: USER_IDS.TEAM_0_PLAYER_1,
  })
  await teamStatsByPlayerCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: USER_IDS.TEAM_0_PLAYER_1,
  })
  await teamStatsByPlayerCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: USER_IDS.TEAM_0_PLAYER_2,
  })
  await teamStatsByPlayerCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: USER_IDS.TEAM_0_PLAYER_2,
  })
  await teamStatsByPlayerCellsClaimedIncrementForMember({
    redis: ctx.redis,
    challengeNumber: 0,
    member: USER_IDS.TEAM_0_PLAYER_2,
    incrementBy: -1,
  })

  await expect(
    teamStatsByPlayerCellsClaimedForMember({
      redis: ctx.redis,
      challengeNumber: 0,
      member: USER_IDS.TEAM_0_PLAYER_1,
    }),
  ).resolves.toBe(2)

  await expect(
    teamStatsByPlayerCellsClaimedGet({
      redis: ctx.redis,
      challengeNumber: 0,
      sort: 'DESC',
      team: 0,
    }),
  ).resolves.toEqual([
    {member: USER_IDS.TEAM_0_PLAYER_1, score: 2},
    {member: USER_IDS.TEAM_0_PLAYER_2, score: 1},
  ] satisfies Array<{member: T2; score: number}>)

  await expect(
    teamStatsByPlayerCellsClaimedGet({
      redis: ctx.redis,
      challengeNumber: 0,
      sort: 'ASC',
      team: 0,
    }),
  ).resolves.toEqual([
    {member: USER_IDS.TEAM_0_PLAYER_2, score: 1},
    {member: USER_IDS.TEAM_0_PLAYER_1, score: 2},
  ] satisfies Array<{member: T2; score: number}>)
})
