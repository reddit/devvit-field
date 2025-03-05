import type {Devvit} from '@devvit/public-api'
import type {Profile} from '../../../shared/save'
import {getTeamFromUserId} from '../../../shared/team'
import type {BanFieldConfig} from '../../../shared/types/level'
import type {DialogMessage} from '../../../shared/types/message'
import {challengeGetCurrentChallengeNumber} from './challenge'
import configRaw from './config.dev.json'
// to-do: Uncomment me for prod!!
// import configRaw from './config.prod.json'
import {teamStatsCellsClaimedGet} from './leaderboards/challenge/team.cellsClaimed'
import {userAscendLevel, userSet} from './user'

const config: Readonly<BanFieldConfig> = configRaw as BanFieldConfig

export const LEADERBOARD_CONFIG: Readonly<BanFieldConfig['leaderboard']> =
  config.leaderboard

export const levels: Readonly<BanFieldConfig['levels']> = config.levels

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
  const subredditLevel = levels.find(x => x.subredditId === ctx.subredditId)
  if (!subredditLevel) {
    throw new Error(
      `No level config found for subreddit ${ctx.subredditId}. Please make sure you are using the right config.{env}.json (or update it for the new sub you installed this app to)!`,
    )
  }
  const userLevel = levels.find(x => x.id === profile.currentLevel)!

  if (profile.currentLevel !== subredditLevel.id) {
    return {
      pass: false,
      message: `You are not on the correct level. You should be at level ${profile.currentLevel}, not ${subredditLevel.id}.`,
      redirectURL: userLevel.url,
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
    profile.lastPlayedChallengeNumberCellsClaimed > 0 &&
    // You can't ascend from the first level
    subredditLevel.id !== levels[0]!.id
  ) {
    const newLevelForUser = await userAscendLevel({
      redis: ctx.redis,
      userId: profile.t2,
    })

    const newLevelForUserConfig = levels.find(x => x.id === newLevelForUser)!

    return {
      pass: false,
      message: `You were on the winning team and claimed more than one cell. You have ascended to level ${newLevelForUser}.`,
      code: 'WrongLevel',
      redirectURL: newLevelForUserConfig.url,
    }
  }

  // Without this fix a user's score will continue to increment on level 0
  //
  // Weird edge case and I can't find a better place for it. We know the user passes, but
  // we also know that the user is not playing the current challenge. We reset their claimed cells to 0
  // in that case.
  //
  // We do not set their last played challenge since they technically haven't played (only observed).
  // Playing would mean that they have attempted to claim cells.
  if (profile.lastPlayedChallengeNumberCellsClaimed > 0) {
    await userSet({
      redis: ctx.redis,
      user: {
        ...profile,
        lastPlayedChallengeNumberCellsClaimed: 0,
      },
    })
  }

  return {pass: true}
}
