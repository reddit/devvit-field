import type {LevelConfig} from '../../../shared/types/level'
import config from './config.prod.json'

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
