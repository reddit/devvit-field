import {Devvit} from '@devvit/public-api'
import {type Team, teamColor, teamPascalCase} from '../../../shared/team'
import {cssHex, fontMSize, fontSSize, paletteWhite} from '../../../shared/theme'
import {
  type Level,
  levelHighlightColor,
  levelPascalCase,
} from '../../../shared/types/level'
import {PixelText} from '../PixelText'

type HeaderProps = {
  pixelRatio: number
  level: Level
  team: Team
}

export function Header(props: HeaderProps): JSX.Element {
  return (
    <hstack width='100%' padding='small' alignment='top'>
      {/* Left Stuff */}
      <vstack grow alignment='start'>
        <hstack>
          <PixelText
            {...props}
            size={fontMSize}
            color={cssHex(levelHighlightColor[props.level])}
          >
            {`${levelPascalCase[props.level]} `}
          </PixelText>
          <PixelText {...props} size={fontMSize} color={cssHex(paletteWhite)}>
            #0033
          </PixelText>
        </hstack>
        <PixelText {...props} size={fontSSize} color={cssHex(paletteWhite)}>
          #0033
        </PixelText>
      </vstack>

      {/* Right Stuff */}
      <vstack alignment='end'>
        <PixelText
          {...props}
          size={fontMSize}
          color={cssHex(teamColor[props.team])}
        >
          {teamPascalCase[props.team]}
        </PixelText>
        <PixelText
          {...props}
          size={fontSSize}
          color={cssHex(teamColor[props.team])}
        >
          0/000000
        </PixelText>
      </vstack>
    </hstack>
  )
}
