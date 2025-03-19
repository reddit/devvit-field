import {type Context, Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import {cssHex, paletteBlack, paletteWhite} from '../../shared/theme'
import {
  type Level,
  config2,
  levelBaseColor,
  levelHighlightColor,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogBeatGameProps = {
  pixelRatio: number
  level: Level
}

export function DialogBeatGame(
  props: DialogBeatGameProps,
  ctx: Context,
): JSX.Element {
  return (
    <Dialog
      onPress={() => ctx.ui.navigateTo(config2.leaderboard.url)}
      {...props}
      buttonLabel={localize('beat-game-dialog-button-label')}
    >
      <BorderedContainer
        height={180}
        width={256}
        {...props}
        lines
        padding='none'
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        <vstack height='100%' width='100%' alignment='center middle'>
          <spacer height='16px' />
          {localize('beat-game-dialog')
            .split(lineBreakToken)
            .map(copy => (
              <PixelText
                key={copy}
                {...props}
                size={14}
                color={cssHex(levelHighlightColor[props.level])}
              >
                {copy}
              </PixelText>
            )) ?? null}
          <spacer height='16px' />
        </vstack>
      </BorderedContainer>
      <spacer grow />

      <PixelText {...props} size={12} color={cssHex(paletteWhite)}>
        {localize('beat-game-dialog-metadata')}
      </PixelText>
      <spacer grow />
    </Dialog>
  )
}
