import { Devvit } from '@devvit/public-api';
import {
  cssHex,
  paletteConsole,
  paletteBlack,
  paletteTerminalGreen,
  paletteWhite,
  paletteBlandBlue,
  paletteOffline,
  fallbackPixelRatio,
} from '../../shared/theme.js';
import { StyledButton } from './StyledButton.js';
import { PixelText } from './PixelText.js';
import { abbreviateNumber } from '../../shared/format.js';
import {
  teamLeaderboardBackgroundColor,
  teamTitleCase,
  type Team,
} from '../../shared/team.ts';

type LeaderboardViewProps = {
  standings?: {
    member: Team;
    score: number;
  }[];
  pixelRatio?: number;
  online?: boolean;
  onPlay?: () => void;
};

export function LeaderboardView(props: LeaderboardViewProps): JSX.Element {
  const standings = props.standings ?? [
    { member: 0, score: 0 },
    { member: 1, score: 0 },
    { member: 2, score: 0 },
    { member: 3, score: 0 },
  ];
  const online = props.online ?? false;
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio;

  return (
    <vstack
      height="100%"
      width="100%"
      backgroundColor={cssHex(paletteConsole)}
      padding="medium"
    >
      {/* Inset Border */}
      <vstack
        height="100%"
        width="100%"
        padding="medium"
        border="thin"
        borderColor={cssHex(paletteBlack)}
        cornerRadius="medium"
        alignment="center middle"
      >
        {/* Field Logo */}
        <image
          imageHeight="264px"
          imageWidth="900px"
          width="100%"
          height="60px"
          description="r/Field Logo"
          url="field-logo-dark.png"
          resizeMode="fit"
        />
        <spacer height="8px" />

        {/* Online Status */}
        <PixelText
          pixelRatio={pixelRatio}
          size={16}
          color={cssHex(online ? paletteTerminalGreen : paletteOffline)}
        >
          {online ? '•ONLINE' : '•OFFLINE'}
        </PixelText>
        <spacer height="24px" />

        <StyledButton
          width={200}
          pixelRatio={pixelRatio}
          onPress={props.onPlay!! ? props.onPlay : () => {}}
        >
          Play r/Field
        </StyledButton>
        <spacer height="24px" />

        <PixelText
          pixelRatio={pixelRatio}
          size={16}
          color={cssHex(paletteWhite)}
          underline
        >
          CURRENT TEAM SCORES
        </PixelText>
        <spacer height="8px" />
        <hstack width="100%" gap="small" alignment="center">
          {standings.map((team) => (
            <TeamTile
              pixelRatio={pixelRatio}
              label={teamTitleCase[team.member]}
              value={team.score}
              color={cssHex(teamLeaderboardBackgroundColor[team.member])}
              key={`team-${team.member}`}
            />
          ))}
        </hstack>
        <spacer height="24px" />

        <PixelText
          pixelRatio={pixelRatio}
          size={16}
          color={cssHex(paletteWhite)}
          underline
        >
          GAME STATS
        </PixelText>
        <spacer height="8px" />
        <hstack width="100%" gap="small" alignment="center">
          <StatTile pixelRatio={pixelRatio} label="PLAYERS" value={1001923} />
          <StatTile pixelRatio={pixelRatio} label="BANS" value={12334} />
          <StatTile pixelRatio={pixelRatio} label="FIELDS" value={15} />
        </hstack>

        <spacer height="24px" />

        <hstack width="100%" alignment="center">
          <PixelText
            pixelRatio={pixelRatio}
            size={12}
            color={cssHex(paletteWhite)}
          >
            DOWNLOAD THE FULL DATA SET
          </PixelText>
          <spacer width="6px" />
          <PixelText
            pixelRatio={pixelRatio}
            size={12}
            color={cssHex(paletteBlandBlue)}
            underline
          >
            HERE
          </PixelText>
        </hstack>
      </vstack>
    </vstack>
  );
}

function TeamTile(props: {
  key: string;
  label: string;
  value: number;
  color: `#${string}`;
  pixelRatio: number;
}) {
  return (
    <vstack
      width="25%"
      height="52px"
      backgroundColor={props.color}
      alignment="center middle"
      key={props.key}
    >
      <PixelText
        pixelRatio={props.pixelRatio}
        size={24}
        color={cssHex(paletteBlack)}
      >
        {abbreviateNumber(props.value)}
      </PixelText>
      <PixelText
        pixelRatio={props.pixelRatio}
        size={12}
        color={cssHex(paletteBlack)}
      >
        {props.label}
      </PixelText>
    </vstack>
  );
}

function StatTile(props: { label: string; value: number; pixelRatio: number }) {
  return (
    <vstack
      width="33.332%"
      height="52px"
      backgroundColor={cssHex(paletteBlack)}
      alignment="center middle"
      border="thin"
      borderColor={cssHex(paletteTerminalGreen)}
    >
      <PixelText
        pixelRatio={props.pixelRatio}
        size={24}
        color={cssHex(paletteTerminalGreen)}
      >
        {abbreviateNumber(props.value)}
      </PixelText>
      <PixelText
        pixelRatio={props.pixelRatio}
        size={12}
        color={cssHex(paletteTerminalGreen)}
      >
        {props.label}
      </PixelText>
    </vstack>
  );
}
