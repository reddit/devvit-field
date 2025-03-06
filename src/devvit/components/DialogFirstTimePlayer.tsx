import {Devvit} from '@devvit/public-api'
import {
  cssHex,
  fallbackPixelRatio,
  paletteBlack,
  paletteFieldLight,
  paletteWhite,
} from '../../shared/theme'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {ListItem} from './ListItem'
import {PixelText} from './PixelText'

type DialogFirstTimePlayerProps = {
  pixelRatio?: number
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
      pixelRatio={pixelRatio}
      buttonLabel="Let's Gooooooo"
    >
      <BorderedContainer
        height={200}
        width={256}
        pixelRatio={pixelRatio}
        backgroundColor={cssHex(paletteBlack)}
        padding='none'
      >
        <vstack height='100%' width='100%' alignment='center middle'>
          <spacer height='16px' />
          <PixelText
            pixelRatio={pixelRatio}
            size={16}
            color={cssHex(paletteWhite)}
          >
            How to Play
          </PixelText>
          <spacer height='8px' />
          <vstack alignment='start middle'>
            <ListItem
              label='1,000,000+ squares per board'
              pixelRatio={pixelRatio}
            />
            <ListItem
              label='Claim as many as you can'
              pixelRatio={pixelRatio}
            />
            <ListItem
              label='But beware of ban boxes—'
              pixelRatio={pixelRatio}
            />
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
