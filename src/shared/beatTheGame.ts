import type {Profile} from './save'

/** The maximum amount of times you can cycle */
const MAX_GLOBAL_POINTS = 250

export const didUserBeatTheGame = (profile: Profile): boolean => {
  return (
    (profile.globalPointCount > 0 &&
      profile.globalPointCount < MAX_GLOBAL_POINTS &&
      !profile.newGamePlusAt) ||
    profile.globalPointCount >= MAX_GLOBAL_POINTS
  )
}
