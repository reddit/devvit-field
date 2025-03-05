import {
  Devvit,
  useState,
  useInterval,
  type Context,
} from '@devvit/public-api';
import { LeaderboardView } from './LeaderboardView.js';
import { leaderboardGet } from '../server/core/leaderboards/global/leaderboard.js';
import type { Team } from '../../shared/team.js';
import { fallbackPixelRatio } from '../../shared/theme.js';
type LeaderboardControllerProps = {
  online?: boolean;
};

// The LeaderboardView has a detatched head to separate out the utilities
// not available to us in the preview state. Enabling us to reuse the template
// between the default and preview states.

export function LeaderboardController(
  props: LeaderboardControllerProps,
  context: Context
): JSX.Element {
  const online = props.online ?? false;
  const [standings, setStandings] = useState<
    {
      member: Team;
      score: number;
    }[]
  >(
    async () =>
      await leaderboardGet({
        redis: context.redis,
        sort: 'DESC',
      })
  );

  const updateState = async () => {
    const newValue = await leaderboardGet({
      redis: context.redis,
      sort: 'DESC',
    });
    setStandings(newValue);
  };

  useInterval(updateState, 30000).start();

  const handleButtonPress = () => {
    context.ui.navigateTo('https://www.reddit.com/r/Field/');
  };

  return (
    <LeaderboardView
      standings={standings}
      pixelRatio={context.dimensions?.scale ?? fallbackPixelRatio}
      online={online} // to-do: implement online status
      onPlay={handleButtonPress}
    />
  );
}
