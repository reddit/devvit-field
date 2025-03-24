import {gauge} from '@devvit/metrics'
import type {Context} from '@devvit/public-api'
import {type Team, teamPascalCase, teams} from '../../../shared/team'
import {liveSettingsGetGlobalCached} from './live-settings'

const activePlayersLookBackWindow = 3

const metrics = {
  activePlayers: gauge({
    name: 'active_players',
    labels: ['team'],
  }),
}

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

export const activePlayersIncrement = async ({
  redis,
  team,
}: {
  redis: Context['redis']
  team: Team
}): Promise<void> => {
  const activePlayersSecondsInterval =
    (await liveSettingsGetGlobalCached({redis}))
      .globalActivePlayerHeartbeatMillis / 1000
  const interval = getIntervalStartTimestamp(
    activePlayersSecondsInterval,
  ).toString()
  await redis.zIncrBy(getActivePlayersKey(team), interval, 1)

  // console.log(
  //   `Increment active players for ${team} to ${value} for interval ${interval}`,
  // )
}

export const activePlayersGet = async ({
  redis,
}: {
  redis: Context['redis']
}): Promise<number> => {
  const activePlayersSecondsInterval =
    (await liveSettingsGetGlobalCached({redis}))
      .globalActivePlayerHeartbeatMillis / 1000
  const lastNTimestamps = getLastNIntervalTimestamps(
    activePlayersSecondsInterval,
    activePlayersLookBackWindow,
  )
  const results = await Promise.all(
    teams.flatMap(team =>
      lastNTimestamps.map(async timestamp => {
        const score = await redis.zScore(
          getActivePlayersKey(team),
          timestamp.toString(),
        )
        if (score) metrics.activePlayers.labels(teamPascalCase[team]).set(score)
        return score
      }),
    ),
  )

  return Math.ceil(
    results.reduce<number>((acc, x) => acc + (x ?? 0), 0) /
      activePlayersLookBackWindow || 1,
  )
}
