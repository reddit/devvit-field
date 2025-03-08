import {type Context, Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {cssHex, paletteBlack, paletteWhite} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
  levelPascalCase,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogUnauthorizedProps = {
  pixelRatio: number
  level: Level
  currentLevel: Level
}

export function DialogUnauthorized(
  props: DialogUnauthorizedProps,
  ctx: Context,
): JSX.Element {
  return (
    <Dialog
      onPress={() =>
        ctx.ui.navigateTo(
          `https://www.reddit.com/r/${levelPascalCase[props.currentLevel]}/`,
        )
      }
      {...props}
      buttonLabel={`${localize('unauthorized-dialog-button-label')} r/${
        levelPascalCase[props.currentLevel]
      }`}
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
          {[
            localize(`unauthorized-dialog-level-${props.level}-Line-0`),
            localize(`unauthorized-dialog-level-${props.level}-Line-1`),
          ].map(copy => (
            <PixelText
              key={copy}
              {...props}
              size={16}
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
        YOUR TEAM NEEDS YOU HERE:
      </PixelText>
      <spacer grow />
    </Dialog>
  )
}
