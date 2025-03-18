import type {User} from '@devvit/public-api'
import {expect, vi} from 'vitest'
import {getDefaultAppConfig} from '../../../shared/types/app-config.js'
import {config2} from '../../../shared/types/level.js'
import type {T2} from '../../../shared/types/tid'
import {initialize} from '../triggers/install'
import {DevvitTest} from './_utils/DevvitTest'
import {setCtxLevel} from './_utils/utils'
import {appInitState} from './app'
import {challengeMakeNew} from './challenge'

DevvitTest.it(
  'app state should pass if the user is on the right level and NOT return the seed',
  async ctx => {
    setCtxLevel(ctx, 0)

    DevvitTest.updateSettings({
      's3-path-prefix': 'dev',
      'skip-s3': true,
    })

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

    await expect(appInitState(ctx)).resolves.toStrictEqual({
      status: 'pass',
      appConfig: getDefaultAppConfig(),
      challengeConfig: {
        partitionSize: 5,
        size: 10,
        totalNumberOfMines: expect.any(Number),
      },
      challengeNumber: 1,
      initialCellsClaimed: [],
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
      initialGlobalXY: {
        x: expect.any(Number),
        y: expect.any(Number),
      },
      initialMapKey: undefined,
      level: config2.levels[0],
      profile: {
        currentLevel: 0,
        hasVerifiedEmail: true,
        globalPointCount: 0,
        lastPlayedChallengeNumberCellsClaimed: 0,
        lastPlayedChallengeNumberForLevel: 0,
        superuser: false,
        t2: 't2_1cgemlvzgq',
        username: 'foo',
      },
      team: 2,
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

    await expect(appInitState(ctx)).resolves.toStrictEqual({
      type: 'Dialog',
      code: 'WrongLevelBanned',
      message: expect.any(String),
      status: 'dialog',
      team: 2,
      redirectURL: expect.any(String),
      profile: expect.any(Object),
      team: 2,
    })
  },
)
