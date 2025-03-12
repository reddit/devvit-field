import {Devvit} from '@devvit/public-api'
import {
  cssHex,
  fallbackPixelRatio,
  paletteBlack,
  paletteFieldLight,
  paletteWhite,
} from '../../shared/theme'
import type {Level} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {ListItem} from './ListItem'
import {PixelText} from './PixelText'

type DialogFirstTimePlayerProps = {
  pixelRatio: number
  level: Level
  onPress: () => void
}

export function DialogFirstTimePlayer(
  props: DialogFirstTimePlayerProps,
): JSX.Element {
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio

  const bodyCopyProps = {
    pixelRatio,
    size: 12,
    color: cssHex(paletteFieldLight),
  }

  return (
    <Dialog {...props} buttonLabel='Play Now'>
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        backgroundColor={cssHex(paletteBlack)}
        padding='none'
      >
        <vstack height='100%' width='100%' alignment='center middle'>
          <spacer height='16px' />
          <PixelText {...props} size={16} color={cssHex(paletteWhite)}>
            How to Play
          </PixelText>
          <spacer height='8px' />
          <vstack alignment='start middle'>
            <ListItem label='1,000,000+ squares per board' {...props} />
            <ListItem label='4 teams fight for territory' {...props} />
            <ListItem label='Claim boxes for your team.' {...props} />
            <ListItem label='The team with the most' {...props} />
            <PixelText {...bodyCopyProps}>
              {'  boxes claims the field and'}
            </PixelText>
            <PixelText {...bodyCopyProps}>{'  resets the round.'}</PixelText>

            <spacer height='8px' />
            <vstack width={100} alignment='center middle'>
              <PixelText {...bodyCopyProps} color='#B72216'>
                {'Hit a hidden ban box and'}
              </PixelText>
              <PixelText {...bodyCopyProps} color='#B72216'>
                {"you'll be banned from "}
              </PixelText>
              <PixelText {...bodyCopyProps} color='#B72216'>
                {'r/Field. Claim wisely!'}
              </PixelText>
            </vstack>
          </vstack>
          <spacer height='16px' />
        </vstack>
      </BorderedContainer>
    </Dialog>
  )
}
