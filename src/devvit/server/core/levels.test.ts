import {expect} from 'vitest'
import {USER_IDS} from '../../../shared/test-utils'
import {DevvitTest} from './_utils/DevvitTest'
import {setCtxLevel} from './_utils/utils'
import {challengeMakeNew} from './challenge'
import {fieldClaimCells} from './field'
import {levelsIsUserInRightPlace} from './levels'
import {userGet, userSet} from './user'

DevvitTest.it(
  'should throw if the subreddit is not found in the level config',
  async ctx => {
    ctx.subredditId = 'not-a-real-subreddit'

    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
      },
    })
    const profile = await userGet({
      redis: ctx.redis,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    await expect(
      levelsIsUserInRightPlace({
        ctx,
        profile,
      }),
    ).rejects.toThrowError()
  },
)

DevvitTest.it('should pass if user have never played on level 0', async ctx => {
  setCtxLevel(ctx, 0)

  await challengeMakeNew({
    ctx,
    config: {
      mineDensity: 0,
      partitionSize: 2,
      size: 2,
    },
  })
  await userSet({
    redis: ctx.redis,
    user: {
      currentLevel: 0,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
      t2: USER_IDS.TEAM_2_PLAYER_1,
      username: 'foo',
      superuser: false,
    },
  })
  const profile = await userGet({
    redis: ctx.redis,
    userId: USER_IDS.TEAM_2_PLAYER_1,
  })

  await expect(
    levelsIsUserInRightPlace({
      ctx,
      profile,
    }),
  ).resolves.toEqual({pass: true})
})

DevvitTest.it(
  'should pass if they are on the right level and the last challenge played is the same as the current challenge being played',
  async ctx => {
    setCtxLevel(ctx, 0)

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
      },
    })

    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    const profile = await userGet({
      redis: ctx.redis,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    await expect(
      levelsIsUserInRightPlace({
        ctx,
        profile,
      }),
    ).resolves.toEqual({pass: true})
  },
)

DevvitTest.it(
  'should pass if they are on the first level, but they have not played the last few challenges even if their team won the last challenge they played',
  async ctx => {
    setCtxLevel(ctx, 0)

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
      },
    })

    // Their teammate
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_2,
        username: 'foo',
        superuser: false,
      },
    })

    // They played the round and their team won
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    // Their teammate clicked as well to make them win
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 1, y: 1}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_2,
    })

    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 1}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_2,
    })

    // They bounce and some more rounds are played...
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })

    const profile = await userGet({
      redis: ctx.redis,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    await expect(
      levelsIsUserInRightPlace({
        ctx,
        profile,
      }),
    ).resolves.toEqual({pass: true})
  },
)

DevvitTest.it(
  'should pass if they are on not the first level, they have not played the last few challenges, and the challenge they did play their team lost',
  async ctx => {
    setCtxLevel(ctx, 0)

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
      },
    })

    // Their opponent
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_1_PLAYER_1,
        username: 'foo',
        superuser: false,
      },
    })

    // They played the round and their team won
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    // Another team played and beat the user's team
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 1, y: 1}],
      ctx,
      userId: USER_IDS.TEAM_1_PLAYER_1,
    })

    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 1}],
      ctx,
      userId: USER_IDS.TEAM_1_PLAYER_1,
    })

    // They bounce and some more rounds are played...
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })

    const profile = await userGet({
      redis: ctx.redis,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    await expect(
      levelsIsUserInRightPlace({
        ctx,
        profile,
      }),
    ).resolves.toEqual({pass: true})
  },
)

DevvitTest.it(
  'should pass if they are on the right level and for some reason we cannot find the standings for the last challenge they played to see if they should ascend or not',
  async ctx => {
    setCtxLevel(ctx, 0)

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
      },
    })

    // They played the round and their team won
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    // They bounce and some more rounds are played...
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })

    // Delete the standings, for some reason we can't find them due to a write error or
    // creation error. This is just safety since we hit this bug playtesting
    await ctx.redis.del(`challenge:${challengeNumber}:stats:team:cells_claimed`)

    const profile = await userGet({
      redis: ctx.redis,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    await expect(
      levelsIsUserInRightPlace({
        ctx,
        profile,
      }),
    ).resolves.toEqual({pass: true})
  },
)

DevvitTest.it('should not pass if user is on the wrong level', async ctx => {
  // User is request level one but they are on level 0!
  setCtxLevel(ctx, 1)

  await challengeMakeNew({
    ctx,
    config: {
      mineDensity: 0,
      partitionSize: 2,
      size: 2,
    },
  })
  await userSet({
    redis: ctx.redis,
    user: {
      // See level 0!
      currentLevel: 0,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
      t2: USER_IDS.TEAM_2_PLAYER_1,
      username: 'foo',
      superuser: false,
    },
  })

  const profile = await userGet({
    redis: ctx.redis,
    userId: USER_IDS.TEAM_2_PLAYER_1,
  })

  await expect(
    levelsIsUserInRightPlace({
      ctx,
      profile,
    }),
  ).resolves.toEqual(expect.objectContaining({pass: false}))
})

DevvitTest.it(
  'should not pass if they are not on level one, their current level is right, and the last challenge they claimed a box in their team won (also force them to ascend)',
  async ctx => {
    // User is request level one but they are on level 0!
    setCtxLevel(ctx, 1)

    const {challengeNumber} = await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 1,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
      },
    })

    // Their teammate
    await userSet({
      redis: ctx.redis,
      user: {
        currentLevel: 0,
        lastPlayedChallengeNumberForLevel: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_2,
        username: 'foo',
        superuser: false,
      },
    })

    // They played the round and their team won
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    // Their teammate clicked as well to make them win
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 1, y: 1}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_2,
    })

    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 1}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_2,
    })

    // They bounce and some more rounds are played...
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })

    const profile = await userGet({
      redis: ctx.redis,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    expect(profile.currentLevel).toBe(1)
    await expect(
      levelsIsUserInRightPlace({
        ctx,
        profile,
      }),
    ).resolves.toEqual(expect.objectContaining({pass: false}))
    await expect(
      userGet({
        redis: ctx.redis,
        userId: USER_IDS.TEAM_2_PLAYER_1,
      }),
    ).resolves.toEqual(expect.objectContaining({currentLevel: 0}))
  },
)
