import type {Context} from '@devvit/public-api'
import {type Team, teams} from '../../../shared/team'

const activePlayersSecondsInterval = 30
const activePlayersLookBackWindow = 3

const getActivePlayersKey = (team: Team) => `active_players:${team}` as const

function getIntervalStartTimestamp(
  intervalSeconds: number,
  offset: number = 0,
): number {
  const intervalMs = intervalSeconds * 1000
  return Math.floor(Date.now() / intervalMs - offset) * intervalMs
}

function getLastNIntervalTimestamps(
  intervalSeconds: number,
  lookBackWindow: number,
): number[] {
  const intervals: number[] = []

  for (let i = 0; i < lookBackWindow; i++) {
    intervals.push(getIntervalStartTimestamp(intervalSeconds, i))
  }

  return intervals
}

// member is going to be a guessable interval timestamp
// score is going to incrementing int

// TODO: configurable polling

export const activePlayersIncrement = async ({
  redis,
  team,
}: {
  redis: Context['redis']
  team: Team
}): Promise<void> => {
  const interval = getIntervalStartTimestamp(
    activePlayersSecondsInterval,
  ).toString()
  const value = await redis.zIncrBy(getActivePlayersKey(team), interval, 1)

  console.log(
    `Increment active players for ${team} to ${value} for interval ${interval}`,
  )
}

export const activePlayersGet = async ({
  redis,
}: {
  redis: Context['redis']
}): Promise<number> => {
  const lastNTimestamps = getLastNIntervalTimestamps(
    activePlayersSecondsInterval,
    activePlayersLookBackWindow,
  )
  const results = await Promise.all(
    teams.flatMap(team =>
      lastNTimestamps.map(timestamp =>
        redis.zScore(getActivePlayersKey(team), timestamp.toString()),
      ),
    ),
  )

  return Math.trunc(
    results.reduce<number>((acc, x) => acc + (x ?? 0), 0) /
      activePlayersLookBackWindow || 1,
  )
}
