import { Devvit, useInterval } from "@devvit/public-api";
import {
  teamLeaderboardBackgroundColor,
  teamTitleCase,
} from "../../shared/team.ts";
import {
  consoleBase,
  cssHex,
  paletteFieldLight,
  paletteBlack,
} from "../../shared/theme.ts";
import { useState2 } from "../hooks/use-state2.ts";
import { leaderboardGet } from "../server/core/leaderboards/global/leaderboard.js";
import { StyledButton } from "./styled-button.tsx";

export type GlobalScoreboardProps = { loaded: boolean; teamScores: number[] };

export function formatScore(score: number): string {
  let scoreString = score.toString();

  // Add leading zeros to make it 4 digits
  while (scoreString.length < 4) {
    scoreString = `0${scoreString}`;
  }
  return scoreString;
}

export const GlobalScoreboard: Devvit.BlockComponent = (_, ctx) => {
  const [standings, setStandings] = useState2(
    async () =>
      await leaderboardGet({
        redis: ctx.redis,
        sort: "DESC",
      })
  );

  const updateState = async () => {
    const newValue = await leaderboardGet({
      redis: ctx.redis,
      sort: "DESC",
    });
    setStandings(newValue);
  };

  useInterval(updateState, 30000).start();

  const handleButtonPress = () => {
    ctx.ui.navigateTo(
      "https://www.reddit.com/r/jastesting/comments/1iyyecj/banfield_47/"
    );
  };

  return (
    <blocks>
      <zstack
        alignment="middle center"
        backgroundColor={cssHex(consoleBase)}
        width="100%"
        height="100%"
        padding="medium"
        borderColor={cssHex(paletteBlack)}
        border="small"
        cornerRadius="medium"
      >
        <vstack alignment="center">
          <image
            url="field.png"
            imageWidth={200}
            imageHeight={50}
            height={50}
          />
          <spacer size="large" />
          <image
            url="online.png"
            imageWidth={476}
            imageHeight={28}
            height="28px"
          />
          <spacer size="medium" />

          <StyledButton
            onPress={() => handleButtonPress()}
            appearance="primary"
            width="80%"
          />
          <spacer size="medium" />
          <text size="large" alignment="center" weight="bold" color="white">
            CURRENT GAME SCORES
          </text>
          <spacer size="small" />
          <hstack>
            {standings.map((team, index) => (
              <hstack key={index.toString()}>
                <vstack
                  alignment="middle center"
                  backgroundColor={cssHex(
                    teamLeaderboardBackgroundColor[team.member]
                  )}
                  padding="small"
                >
                  <text
                    size="xxlarge"
                    alignment="center"
                    weight="bold"
                    color="black"
                  >
                    {formatScore(team.score)}
                  </text>
                  <spacer size="small" />
                  <text size="small" alignment="center" color="black">
                    {teamTitleCase[team.member]}
                  </text>
                </vstack>
                <spacer size="small" />
              </hstack>
            ))}
          </hstack>
          <spacer size="medium" />
          <text size="large" alignment="center" weight="bold" color="white">
            GAME STATS
          </text>
          <spacer size="small" />

          <hstack>
            <vstack
              alignment="middle center"
              padding="small"
              border="small"
              borderColor={cssHex(paletteFieldLight)}
              backgroundColor={cssHex(paletteBlack)}
            >
              <text
                size="xxlarge"
                alignment="center"
                weight="bold"
                color={cssHex(paletteFieldLight)}
              >
                1001923
              </text>
              <spacer size="small" />
              <text
                size="xxlarge"
                alignment="center"
                color={cssHex(paletteFieldLight)}
              >
                PLAYERS
              </text>
            </vstack>
            <spacer size="small" />
            <vstack
              alignment="middle center"
              padding="small"
              border="small"
              borderColor={cssHex(paletteFieldLight)}
              backgroundColor={cssHex(paletteBlack)}
            >
              <text
                size="xxlarge"
                alignment="center"
                weight="bold"
                color={cssHex(paletteFieldLight)}
              >
                12334
              </text>
              <spacer size="small" />
              <text
                size="xxlarge"
                alignment="center"
                color={cssHex(paletteFieldLight)}
              >
                BANNED
              </text>
            </vstack>
            <spacer size="small" />
            <vstack
              alignment="middle center"
              padding="small"
              border="small"
              borderColor={cssHex(paletteFieldLight)}
              backgroundColor={cssHex(paletteBlack)}
            >
              <text
                size="xxlarge"
                alignment="center"
                weight="bold"
                color={cssHex(paletteFieldLight)}
              >
                15
              </text>
              <spacer size="small" />
              <text
                size="xxlarge"
                alignment="center"
                color={cssHex(paletteFieldLight)}
              >
                COUNTRIES
              </text>
            </vstack>
          </hstack>
        </vstack>
      </zstack>
    </blocks>
  );
};
