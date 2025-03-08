import type {User} from '@devvit/public-api'
import {expect, vi} from 'vitest'
import type {T2} from '../../../shared/types/tid'
import {initialize} from '../triggers/install'
import {DevvitTest} from './_utils/DevvitTest'
import {setCtxLevel} from './_utils/utils'
import {appInitState} from './app'
import {challengeMakeNew} from './challenge'
import {levels} from './levels'

DevvitTest.it(
  'app state should pass if the user is on the right level and NOT return the seed',
  async ctx => {
    setCtxLevel(ctx, 0)

    vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
      username: 'foo',
      id: ctx.userId as T2,
      isAdmin: false,
      hasVerifiedEmail: true,
    } as User)

    await initialize(ctx)

    await challengeMakeNew({
      ctx,
    })

    await expect(appInitState(ctx)).resolves.toEqual({
      status: 'pass',
      appConfig: {
        globalClickCooldownMillis: 1000,
        globalServerPollingTimeMillis: 60000,
      },
      challengeConfig: {
        partitionSize: 5,
        size: 10,
        totalNumberOfMines: expect.any(Number),
      },
      challengeNumber: 1,
      initialCellsClaimed: [
        {
          member: 3,
          score: 0,
        },
        {
          member: 2,
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
      ],
      minesHitByTeam: [
        {
          member: 3,
          score: 0,
        },
        {
          member: 2,
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
      ],
      initialDeltas: [],
      initialGlobalXY: {
        x: expect.any(Number),
        y: expect.any(Number),
      },
      level: levels[0],
      profile: {
        currentLevel: 0,
        hasVerifiedEmail: true,
        lastPlayedChallengeNumberCellsClaimed: 0,
        lastPlayedChallengeNumberForLevel: 0,
        superuser: false,
        t2: 't2_1cgemlvzgq',
        username: 'foo',
      },
      visible: 100,
    })
  },
)

DevvitTest.it('app state should throw if level is not found', async ctx => {
  ctx.subredditId = 'notfound'

  vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
    username: 'foo',
    id: ctx.userId as T2,
    isAdmin: false,
    hasVerifiedEmail: true,
  } as User)

  await initialize(ctx)

  await challengeMakeNew({
    ctx,
  })

  await expect(() => appInitState(ctx)).rejects.toThrow()
})

DevvitTest.it(
  'should not pass if the user is on the wrong level',
  async ctx => {
    setCtxLevel(ctx, 1)

    vi.spyOn(ctx.reddit, 'getUserById').mockResolvedValue({
      username: 'foo',
      id: ctx.userId as T2,
      isAdmin: false,
      hasVerifiedEmail: true,
    } as User)

    await initialize(ctx)

    await challengeMakeNew({
      ctx,
    })

    await expect(appInitState(ctx)).resolves.toEqual({
      code: 'WrongLevel',
      message:
        'You are not on the correct level. You should be at level 0, not 1.',
      status: 'dialog',
      redirectURL: expect.any(String),
      profile: expect.any(Object),
    })
  },
)
