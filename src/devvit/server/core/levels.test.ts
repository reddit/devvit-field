import {expect} from 'vitest'
import {USER_IDS} from '../../../shared/test-utils'
import {DevvitTest} from './_utils/DevvitTest'
import {setCtxLevel} from './_utils/utils'
import {challengeMakeNew} from './challenge'
import {fieldClaimCells} from './field'
import {teamStatsCellsClaimedIncrementForMemberTotal} from './leaderboards/challenge/team.cellsClaimed'
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
        hasVerifiedEmail: true,
        globalPointCount: 0,
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

DevvitTest.it(
  'should pass if no one has ever claimed a cell for a challenge',
  async ctx => {
    setCtxLevel(ctx, 0)

    // Challenge number 1
    await challengeMakeNew({
      ctx,
      config: {
        mineDensity: 0,
        partitionSize: 2,
        size: 2,
      },
    })

    // Challenge number 2
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
        // Note the one here to denote they have played a valid challenge!
        lastPlayedChallengeNumberForLevel: 1,
        lastPlayedChallengeNumberCellsClaimed: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
        globalPointCount: 0,
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
    ).resolves.toStrictEqual({code: 'FirstTimePlayerOrClicker', pass: true})
  },
)

DevvitTest.it('should pass if user has never played on level 0', async ctx => {
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
      hasVerifiedEmail: true,
      globalPointCount: 0,
    },
  })

  await teamStatsCellsClaimedIncrementForMemberTotal(
    ctx.redis,
    challengeNumber,
    0,
    1,
  )

  const profile = await userGet({
    redis: ctx.redis,
    userId: USER_IDS.TEAM_2_PLAYER_1,
  })

  await expect(
    levelsIsUserInRightPlace({
      ctx,
      profile,
    }),
  ).resolves.toStrictEqual({pass: true, code: 'FirstTimePlayerOrClicker'})
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
        hasVerifiedEmail: true,
        globalPointCount: 0,
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
    ).resolves.toStrictEqual({code: 'PlayingCurrentLevel', pass: true})
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
        hasVerifiedEmail: true,
        globalPointCount: 0,
      },
    })

    // They played the round
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    // They win the round
    await teamStatsCellsClaimedIncrementForMemberTotal(
      ctx.redis,
      challengeNumber,
      2,
      3,
    )

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
    ).resolves.toStrictEqual({
      activeChallengeNumberForLevel: 4,
      code: 'RightLevelWrongChallenge',
      pass: true,
      standingsForUserLastPlayedChallenge: [
        {
          member: 2,
          score: 3,
        },
      ],
    })

    // Make sure that the user's cells claimed is reset to 0
    await expect(
      userGet({
        redis: ctx.redis,
        userId: USER_IDS.TEAM_2_PLAYER_1,
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({lastPlayedChallengeNumberCellsClaimed: 0}),
    )
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
        hasVerifiedEmail: true,
        globalPointCount: 0,
      },
    })

    // They played the round
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    // They lose the round
    await teamStatsCellsClaimedIncrementForMemberTotal(
      ctx.redis,
      challengeNumber,
      0, // Team 0 is the winning team
      3,
    )

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

    const profile = await userGet({
      redis: ctx.redis,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    await expect(
      levelsIsUserInRightPlace({
        ctx,
        profile,
      }),
    ).resolves.toStrictEqual({
      activeChallengeNumberForLevel: 3,
      code: 'RightLevelWrongChallenge',
      pass: true,
      standingsForUserLastPlayedChallenge: [
        {
          member: 0,
          score: 3,
        },
      ],
    })
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
      hasVerifiedEmail: true,
      globalPointCount: 0,
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
  ).resolves.toStrictEqual(expect.objectContaining({pass: false}))
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
        lastPlayedChallengeNumberForLevel: 1,
        lastPlayedChallengeNumberCellsClaimed: 0,
        globalPointCount: 0,
        t2: USER_IDS.TEAM_2_PLAYER_1,
        username: 'foo',
        superuser: false,
        hasVerifiedEmail: true,
      },
    })

    // Claim a cell so that it registers they played a round
    await fieldClaimCells({
      challengeNumber,
      coords: [{x: 0, y: 0}],
      ctx,
      userId: USER_IDS.TEAM_2_PLAYER_1,
    })

    // They played the round and their team won
    await teamStatsCellsClaimedIncrementForMemberTotal(
      ctx.redis,
      challengeNumber,
      2,
      3,
    )

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
    ).resolves.toStrictEqual(expect.objectContaining({pass: false}))

    await expect(
      userGet({
        redis: ctx.redis,
        userId: USER_IDS.TEAM_2_PLAYER_1,
      }),
    ).resolves.toStrictEqual(expect.objectContaining({currentLevel: 0}))
  },
)
