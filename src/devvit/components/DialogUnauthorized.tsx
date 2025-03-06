import {Devvit} from '@devvit/public-api'
import {
  cssHex,
  fallbackPixelRatio,
  paletteBlack,
  paletteWhite,
} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

const LEVEL_COPY = [
  ['Nice try, but you', 'are still banned.'],
  ['Easy, tiger. You know', `you don't belong here.`],
  [`Buddy, you're not allowed`, 'in this community.'],
  ['Excuse me. What do you', `think you're doing here?`],
  ['Looks like you took a', 'wrong turn somewhere.'],
]

type DialogUnauthorizedProps = {
  pixelRatio?: number
  level?: Level
}

export function DialogUnauthorized(
  props: DialogUnauthorizedProps,
): JSX.Element {
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio
  const level = props.level ?? 0

  return (
    <Dialog
      onPress={() => console.log('do something')}
      pixelRatio={pixelRatio}
      buttonLabel='Go To r/Level'
      level={level}
    >
      <BorderedContainer
        height={180}
        width={256}
        pixelRatio={pixelRatio}
        lines
        padding='none'
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelBaseColor[level])}
      >
        <vstack height='100%' width='100%' alignment='center middle'>
          <spacer height='16px' />
          {LEVEL_COPY[level]?.map(copy => (
            <PixelText
              key={copy}
              pixelRatio={pixelRatio}
              size={16}
              color={cssHex(levelHighlightColor[level])}
            >
              {copy}
            </PixelText>
          )) ?? null}
          <spacer height='16px' />
        </vstack>
      </BorderedContainer>
      <spacer grow />

      <PixelText size={12} color={cssHex(paletteWhite)}>
        YOUR TEAM NEEDS YOU HERE:
      </PixelText>
      <spacer grow />
    </Dialog>
  )
}
