import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import type {T2} from '../../shared/types/tid'
import {
  challengeConfigGet,
  challengeGetCurrentChallengeNumber,
} from '../server/core/challenge'
import {enforceBounds, fieldNukeCells} from '../server/core/field'

export const superuserFormKey: FormKey = Devvit.createForm(
  {
    title: 'Nuke Cells',
    description:
      'Nuke cells through rainbow superpowers. Blasts around a given X,Y point. You can see the coordinates by playing selecting a cell. Choose the middle of the thing you want to blast.',
    fields: [
      {type: 'number', name: 'x', label: 'X', required: true},
      {type: 'number', name: 'y', label: 'Y', required: true},
      {
        type: 'number',
        name: 'blastRadius',
        label: 'Blast Radius',
        required: true,
      },
    ],
  },
  async ({values}, ctx) => {
    try {
      if (!ctx.userId) {
        ctx.ui.showToast('Must be logged in to nuke!')
        return
      }

      const challengeNumber = await challengeGetCurrentChallengeNumber({
        redis: ctx.redis,
      })
      const fieldConfig = await challengeConfigGet({
        redis: ctx.redis,
        challengeNumber,
        subredditId: ctx.subredditId,
      })

      enforceBounds({
        coord: {x: values.x, y: values.y},
        rows: fieldConfig.size,
        cols: fieldConfig.size,
      })

      if (values.blastRadius < 1) {
        throw new Error('Blast radius must be at least 1')
      }

      if (values.blastRadius > 10) {
        throw new Error('Blast radius must be at most 10')
      }

      await fieldNukeCells({
        blastRadius: values.blastRadius,
        coord: {x: values.x, y: values.y},
        ctx,
        userId: ctx.userId as T2,
        challengeNumber,
      })

      ctx.ui.showToast('Cells nuked!')
    } catch (error) {
      if (error instanceof Error) {
        ctx.ui.showToast(error.message)
      } else {
        ctx.ui.showToast('An unknown error occurred')
      }
    }
  },
)
export const nukeCellsMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[Field] Nuke Cells',
  location: ['post', 'subreddit'],
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(superuserFormKey)
  },
})
