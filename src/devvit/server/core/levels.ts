import type {Devvit} from '@devvit/public-api'
import type {Profile} from '../../../shared/save'
import {getTeamFromUserId} from '../../../shared/team'
import type {LevelConfig} from '../../../shared/types/level'
import type {DialogMessage} from '../../../shared/types/message'
import {challengeGetCurrentChallengeNumber} from './challenge'
import config from './config.dev.json'
// import config from './config.prod.json'
import {teamStatsCellsClaimedGet} from './leaderboards/challenge/team.cellsClaimed'
import {userAscendLevel} from './user'

export const levels: readonly Readonly<LevelConfig>[] =
  config.levels as LevelConfig[]

export const makeLevelRedirect = (levelNumber: number) => {
  const level = levels.find(x => x.id === levelNumber)

  if (!level) {
    throw new Error(`Level ${levelNumber} not found`)
  }

  // TODO: I notice this redirects on the client, could save some time by using the EXACT url
  return `https://www.reddit.com/r/${level.subredditName}/comments/${level.postId}`
}

/**
 * Make sure the user has access to:
 * 1. View the field
 * 2. Claims cells for the field
 *
 * pass: true means the user can claim cells
 * pass: false means the user cannot claim cells
 *
 * On false, you'll be provided a message and a redirectURL
 * to send the user to.
 */
type LevelsIsUserInRightPlaceResponse =
  | {
      pass: true
    }
  | ({
      pass: false
      redirectURL: string
    } & Omit<DialogMessage, 'type'>)

export const levelsIsUserInRightPlace = async ({
  profile,
  challengeNumber,
  ctx,
}: {
  profile: Profile
  challengeNumber: number
  ctx: Devvit.Context
}): Promise<LevelsIsUserInRightPlaceResponse> => {
  // User can only descend on level 0 so they always pass
  if (
    // profile.lastPlayedChallengeNumberForLevel === 0 &&
    profile.currentLevel === 0
  ) {
    return {pass: true}
  }

  const level = levels.find(x => x.subredditId === ctx.subredditId)
  if (!level) {
    throw new Error(`No level config found for subreddit ${ctx.subredditId}`)
  }

  if (profile.currentLevel !== level.id) {
    return {
      pass: false,
      message: `You are not on the correct level. You should be at level ${profile.currentLevel}, not ${level.id}.`,
      redirectURL: makeLevelRedirect(profile.currentLevel),
      code: 'WrongLevel',
    }
  }

  const currentChallengeNumber = await challengeGetCurrentChallengeNumber({
    redis: ctx.redis,
  })

  if (profile.lastPlayedChallengeNumberForLevel === currentChallengeNumber) {
    return {pass: true}
  }

  const standings = await teamStatsCellsClaimedGet({
    challengeNumber,
    redis: ctx.redis,
  })

  const winningTeam = standings[0]!.member
  const userTeam = getTeamFromUserId(profile.t2)

  if (winningTeam === userTeam) {
    if (profile.lastPlayedChallengeNumberCellsClaimed > 0) {
      const newLevel = await userAscendLevel({
        redis: ctx.redis,
        userId: profile.t2,
      })

      const firstLevel = levels[0]!.id
      if (newLevel === firstLevel) {
        return {
          pass: true,
        }
      }

      return {
        pass: false,
        message: `You were on the winning team and claimed more than one cell. You have ascended to level ${newLevel}.`,
        code: 'WrongLevel',
        redirectURL: makeLevelRedirect(newLevel),
      }
    }
  }

  return {pass: true}
}
