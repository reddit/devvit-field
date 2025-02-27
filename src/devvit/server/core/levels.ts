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
  ctx,
}: {
  profile: Profile
  ctx: Devvit.Context
}): Promise<LevelsIsUserInRightPlaceResponse> => {
  // Make sure the level config exists for the subreddit before anything
  const level = levels.find(x => x.subredditId === ctx.subredditId)
  if (!level) {
    throw new Error(
      `No level config found for subreddit ${ctx.subredditId}. Please make sure you are using the right config.{env}.json (or update it for the new sub you installed this app to)!`,
    )
  }

  if (profile.currentLevel !== level.id) {
    return {
      pass: false,
      message: `You are not on the correct level. You should be at level ${profile.currentLevel}, not ${level.id}.`,
      redirectURL: level.url,
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
    challengeNumber: profile.lastPlayedChallengeNumberForLevel,
    redis: ctx.redis,
    sort: 'DESC',
  })

  // If there are no standings for some reason, just pass
  if (standings.length === 0) {
    return {pass: true}
  }

  const winningTeam = standings[0]!.member
  const userTeam = getTeamFromUserId(profile.t2)

  if (
    winningTeam === userTeam &&
    profile.lastPlayedChallengeNumberCellsClaimed > 0
  ) {
    const newLevelForUser = await userAscendLevel({
      redis: ctx.redis,
      userId: profile.t2,
    })

    const firstLevel = levels[0]!.id
    if (level.id === firstLevel) {
      return {
        pass: true,
      }
    }

    const newLevelForUserConfig = levels.find(x => x.id === newLevelForUser)!

    return {
      pass: false,
      message: `You were on the winning team and claimed more than one cell. You have ascended to level ${newLevelForUser}.`,
      code: 'WrongLevel',
      redirectURL: newLevelForUserConfig.url,
    }
  }

  return {pass: true}
}
