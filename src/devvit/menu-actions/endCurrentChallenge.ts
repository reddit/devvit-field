import {Devvit, type FormKey, type MenuItem} from '@devvit/public-api'
import {challengeGetCurrentChallengeNumber} from '../server/core/challenge'
import {fieldEndGame} from '../server/core/field'
import {teamStatsCellsClaimedGet} from '../server/core/leaderboards/challenge/team.cellsClaimed'

export const endGameFormKey: FormKey = Devvit.createForm(
  {
    title: 'End Current Challenge',
    description: 'This will immediately end the current challenge',
    fields: [
      {
        type: 'boolean',
        name: 'confirm',
        label: 'Confirm End Game',
        defaultValue: false,
        helpText:
          'Are you sure you want to end the current challenge immediately?',
      },
    ],
  },
  async ({values}, ctx) => {
    if (!values.confirm) {
      ctx.ui.showToast('Challenge end cancelled.')
      return
    }

    try {
      const challengeNumber = await challengeGetCurrentChallengeNumber({
        redis: ctx.redis,
      })
      const standings = await teamStatsCellsClaimedGet({
        challengeNumber,
        redis: ctx.redis,
      })
      const p1BoxCount = 0 // to-do: figure this out

      await fieldEndGame(ctx, challengeNumber, standings, p1BoxCount)

      ctx.ui.showToast(`Challenge #${challengeNumber} has been ended.`)
    } catch (error) {
      if (error instanceof Error) {
        ctx.ui.showToast(`Error: ${error.message}`)
      } else {
        ctx.ui.showToast('An error occurred while ending the challenge.')
      }
    }
  },
)

export const endCurrentChallengeMenuAction = (): MenuItem => ({
  forUserType: ['moderator'],
  label: '[BanField] End Current Challenge',
  location: ['post', 'subreddit'],
  onPress: (_ev, ctx) => {
    ctx.ui.showForm(endGameFormKey)
  },
})
