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
    <Dialog
      onPress={() => console.log('do something')}
      {...props}
      buttonLabel="Let's Gooooooo"
    >
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
            <ListItem label='Claim as many as you can' {...props} />
            <ListItem label='But beware of ban boxes—' {...props} />
            <PixelText {...bodyCopyProps}>
              {"  hit one and you'll be banned"}
            </PixelText>
            <PixelText {...bodyCopyProps}>
              {'  from the community FOREVER!'}
            </PixelText>
          </vstack>
          <spacer height='16px' />
        </vstack>
      </BorderedContainer>
    </Dialog>
  )
}
