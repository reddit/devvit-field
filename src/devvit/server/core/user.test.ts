import type {User} from '@devvit/public-api'
import {beforeEach, expect, vi} from 'vitest'
import type {Profile} from '../../../shared/save'
import {USER_IDS} from '../../../shared/test-utils'
import {config2} from '../../../shared/types/level.js'
import type {T2} from '../../../shared/types/tid'
import {DevvitTest} from './_utils/DevvitTest'
import {
  leaderboardGet,
  leaderboardInit,
} from './leaderboards/global/leaderboard'
import * as userMethods from './user'

beforeEach(async () => {
  await DevvitTest.resetRedis()
  vi.resetAllMocks()
})

DevvitTest.it('userGetOrSet - return defaults if no user found', async ctx => {
  await expect(
    userMethods.userGetOrSet({ctx: {...ctx, userId: undefined}}),
  ).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: 't2_0',
    username: 'anonymous',
    superuser: false,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  } satisfies Profile)
})

DevvitTest.it('userGetOrSet - return username and cache', async ctx => {
  const spy = vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  } satisfies Profile)

  await expect(
    userMethods.userGet({redis: ctx.redis, userId: ctx.userId as T2}),
  ).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  } satisfies Profile)

  expect(spy).toHaveBeenCalledTimes(1)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  } satisfies Profile)
  expect(spy).toHaveBeenCalledTimes(1)
})

DevvitTest.it('userGetOrSet - set superuser', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: true,
    hasVerifiedEmail: true,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: true,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  } satisfies Profile)
})

DevvitTest.it('makeSuperuser - sets the user to be a superuser', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  } satisfies Profile)

  await userMethods.userMakeSuperuser({
    redis: ctx.redis,
    userId: ctx.userId as T2,
  })

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: true,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  } satisfies Profile)
})

DevvitTest.it('can block and unblock a user', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  const unbannedUser: Profile = {
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  }

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual(
    unbannedUser,
  )

  await userMethods.userBlock({redis: ctx.redis, userId: ctx.userId as T2})

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    ...unbannedUser,
    blocked: expect.any(String),
  } satisfies Profile)

  await userMethods.userUnblock({redis: ctx.redis, userId: ctx.userId as T2})

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual(
    unbannedUser,
  )
})

DevvitTest.it('saves verified email value', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: false,
  } as User)

  const user: Profile = {
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: false,
    globalPointCount: 0,
  }

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual(user)
})

DevvitTest.it('Sets the user to played if the have not played', async ctx => {
  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  const user: Profile = {
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: true,
    globalPointCount: 0,
  }

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual(user)

  await userMethods.userSetPlayedIfNotExists({
    redis: ctx.redis,
    userId: ctx.userId as T2,
  })

  await expect(userMethods.userGetOrSet({ctx})).resolves.toStrictEqual({
    ...user,
    startedPlayingAt: expect.any(String),
  })
})

DevvitTest.it(
  'userAttemptToClaimGlobalPointForTeam - fails when not on the last level',
  async ctx => {
    vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
      username: 'foo',
      id: ctx.userId as T2,
      isAdmin: false,
      hasVerifiedEmail: false,
    } as User)

    await userMethods.userGetOrSet({ctx})

    const user: Profile = {
      currentLevel: 0,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
      t2: ctx.userId as T2,
      username: 'foo',
      superuser: false,
      hasVerifiedEmail: false,
      globalPointCount: 0,
    }

    await userMethods.userSet({
      redis: ctx.redis,
      user,
    })

    await expect(
      userMethods.userAttemptToClaimGlobalPointForTeam({ctx, userId: user.t2}),
    ).rejects.toThrowError()
  },
)

DevvitTest.it(
  'userAttemptToClaimGlobalPointForTeam - fails when subreddit id does not exists',
  async ctx => {
    vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
      username: 'foo',
      id: ctx.userId as T2,
      isAdmin: false,
      hasVerifiedEmail: false,
    } as User)

    const user: Profile = {
      currentLevel: 0,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
      t2: ctx.userId as T2,
      username: 'foo',
      superuser: false,
      hasVerifiedEmail: false,
      globalPointCount: 0,
    }

    await userMethods.userGetOrSet({ctx})

    await userMethods.userSet({
      redis: ctx.redis,
      user: {...user, currentLevel: 4},
    })

    await expect(() =>
      userMethods.userAttemptToClaimGlobalPointForTeam({ctx, userId: user.t2}),
    ).rejects.toThrowError()
  },
)

DevvitTest.it(
  'userAttemptToClaimGlobalPointForTeam - fails when subreddit id is not the last level',
  async ctx => {
    // Spoofing the subreddit id on context!
    ctx.subredditId = config2.levels[0]!.subredditId

    vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
      username: 'foo',
      id: ctx.userId as T2,
      isAdmin: false,
      hasVerifiedEmail: false,
    } as User)

    const user: Profile = {
      currentLevel: 0,
      lastPlayedChallengeNumberForLevel: 0,
      lastPlayedChallengeNumberCellsClaimed: 0,
      t2: ctx.userId as T2,
      username: 'foo',
      superuser: false,
      hasVerifiedEmail: false,
      globalPointCount: 0,
    }

    await userMethods.userGetOrSet({ctx})

    await userMethods.userSet({
      redis: ctx.redis,
      user: {...user, currentLevel: 4},
    })

    await expect(() =>
      userMethods.userAttemptToClaimGlobalPointForTeam({ctx, userId: user.t2}),
    ).rejects.toThrowError()
  },
)

DevvitTest.it('userAttemptToClaimGlobalPointForTeam - succeeds', async ctx => {
  ctx.subredditId = config2.levels.at(-1)!.subredditId
  ctx.userId = USER_IDS.TEAM_2_PLAYER_1

  await leaderboardInit({redis: ctx.redis})

  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: false,
  } as User)

  const user: Profile = {
    currentLevel: 4,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: false,
    globalPointCount: 0,
  }

  await userMethods.userGetOrSet({ctx})

  await userMethods.userSet({
    redis: ctx.redis,
    user: {...user, currentLevel: 4},
  })

  await expect(
    userMethods.userAttemptToClaimGlobalPointForTeam({ctx, userId: user.t2}),
  ).resolves.toBeUndefined()

  await expect(
    userMethods.userGet({redis: ctx.redis, userId: user.t2}),
  ).resolves.toStrictEqual({
    currentLevel: 0,
    lastPlayedChallengeNumberForLevel: 0,
    lastPlayedChallengeNumberCellsClaimed: 0,
    t2: ctx.userId as T2,
    username: 'foo',
    superuser: false,
    hasVerifiedEmail: false,
    globalPointCount: 1,
  } satisfies Profile)

  await expect(
    leaderboardGet({redis: ctx.redis, sort: 'DESC'}),
  ).resolves.toStrictEqual([
    {
      member: 2,
      score: 1,
    },
    {
      member: 3,
      score: 0,
    },
    {
      member: 1,
      score: 0,
    },
    {
      member: 0,
      score: 0,
    },
  ])
})
