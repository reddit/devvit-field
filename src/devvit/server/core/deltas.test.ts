import {expect} from 'vitest'
import {DevvitTest} from './_utils/DevvitTest'
import {type Delta, deltasAdd, deltasClear, deltasGet} from './deltas'

DevvitTest.it('should be able to add, get, and remove deltas', async ctx => {
  const challengeNumber = 0
  await expect(deltasGet({redis: ctx.redis, challengeNumber})).resolves.toEqual(
    [],
  )

  const deltas: Delta[] = [
    {
      coord: {x: 0, y: 0},
      team: 0,
      isMine: false,
    },
    {
      coord: {x: 1, y: 0},
      team: 0,
      isMine: false,
    },
  ]

  await deltasAdd({
    redis: ctx.redis,
    challengeNumber,
    deltas,
  })

  await expect(deltasGet({redis: ctx.redis, challengeNumber})).resolves.toEqual(
    deltas,
  )

  await deltasClear({
    redis: ctx.redis,
    challengeNumber,
  })

  await expect(deltasGet({redis: ctx.redis, challengeNumber})).resolves.toEqual(
    [],
  )
})
