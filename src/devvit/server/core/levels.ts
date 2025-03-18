import type {Devvit} from '@devvit/public-api'
import type {Profile} from '../../../shared/save'
import {getTeamFromUserId} from '../../../shared/team'
import {config2} from '../../../shared/types/level'
import type {DialogMessage} from '../../../shared/types/message'
import {challengeGetCurrentChallengeNumber} from './challenge'
import {teamStatsCellsClaimedGetTotal} from './leaderboards/challenge/team.cellsClaimed'
import {userAscendLevel, userSet} from './user'

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
    } & DialogMessage)

export const levelsIsUserInRightPlace = async ({
  profile,
  ctx,
}: {
  profile: Profile
  ctx: Devvit.Context
}): Promise<LevelsIsUserInRightPlaceResponse> => {
  // Make sure the level config exists for the subreddit before anything
  const subredditLevel = config2.levels.find(
    x => x.subredditId === ctx.subredditId,
  )
  if (!subredditLevel) {
    throw new Error(
      `No level config found for subreddit ${ctx.subredditId}. Please make sure you are using the right config.{env}.json (or update it for the new sub you installed this app to)!`,
    )
  }
  const userLevel = config2.levels.find(x => x.id === profile.currentLevel)!
  const userTeam = getTeamFromUserId(profile.t2)

  if (profile.currentLevel !== subredditLevel.id) {
    return {
      pass: false,
      message: `You have been permanently banned from r/${subredditLevel.subredditName}`,
      redirectURL: userLevel.url,
      code: 'WrongLevelBanned',
      profile,
      team: userTeam,
      type: 'Dialog',
    }
  }

  const currentChallengeNumber = await challengeGetCurrentChallengeNumber({
    redis: ctx.redis,
  })

  if (profile.lastPlayedChallengeNumberForLevel === currentChallengeNumber) {
    return {pass: true}
  }

  const standings = await teamStatsCellsClaimedGetTotal(
    ctx.redis,
    profile.lastPlayedChallengeNumberForLevel,
    'DESC',
  )

  // If there are no standings for some reason, just pass
  if (standings.length === 0) {
    return {pass: true}
  }

  const winningTeam = standings[0]!.member

  if (
    winningTeam === userTeam &&
    profile.lastPlayedChallengeNumberCellsClaimed > 0 &&
    // You can't ascend from the first level
    subredditLevel.id !== config2.levels[0]!.id
  ) {
    const newLevelForUser = await userAscendLevel({
      redis: ctx.redis,
      userId: profile.t2,
    })

    const newLevelForUserConfig = config2.levels.find(
      x => x.id === newLevelForUser,
    )!

    return {
      pass: false,
      message: `You were on the winning team and claimed more than one cell. You have ascended to level ${newLevelForUser}.`,
      code: 'ChallengeEndedAscend',
      redirectURL: newLevelForUserConfig.url,
      type: 'Dialog',
      profile,
      standings,
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
