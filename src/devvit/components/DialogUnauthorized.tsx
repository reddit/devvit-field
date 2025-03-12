import {type Context, Devvit} from '@devvit/public-api'
import {lineBreakToken, localize, variableStartToken} from '../../shared/locale'
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
  redirectURL: string
  currentLevel: Level
}

export function DialogUnauthorized(
  props: DialogUnauthorizedProps,
  ctx: Context,
): JSX.Element {
  const words = localize('unauthorized-dialog-button-label').split(' ')
  const tokenIndex = words.findIndex(word =>
    word.startsWith(variableStartToken),
  )

  const buttonLabel = [
    ...words.slice(0, tokenIndex),
    `r/${levelPascalCase[props.currentLevel]}`,
    ...words.slice(tokenIndex + 1),
  ].join(' ')

  return (
    <Dialog
      onPress={() => ctx.ui.navigateTo(props.redirectURL)}
      {...props}
      buttonLabel={buttonLabel}
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
          {localize(`unauthorized-dialog-level-${props.level}`)
            .split(lineBreakToken)
            .map(copy => (
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
        {localize('unauthorized-dialog-metadata')}
      </PixelText>
      <spacer grow />
    </Dialog>
  )
}
