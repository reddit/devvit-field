import {Devvit} from '@devvit/public-api'
import {
  consoleBase,
  cssHex,
  fallbackPixelRatio,
  paletteBlack,
  paletteFieldLight,
  paletteWhite,
} from '../../shared/theme'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type FirstTimePlayerViewProps = {
  pixelRatio?: number
}

export function FirstTimePlayerView(
  props: FirstTimePlayerViewProps,
): JSX.Element {
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio

  const bodyCopyProps = {
    pixelRatio,
    size: 12,
    color: cssHex(paletteFieldLight),
  }

  return (
    <zstack
      height='100%'
      width='100%'
      alignment='center middle'
      backgroundColor={cssHex(consoleBase)}
    >
      {/* Background */}
      {/* to-do: add representation of base screen here */}

      {/* Content */}
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
        >
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
        </BorderedContainer>
      </Dialog>
    </zstack>
  )
}

function ListItem(props: {label: string; pixelRatio: number}) {
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio
  return (
    <hstack>
      <PixelText size={12} pixelRatio={pixelRatio} color={cssHex(paletteWhite)}>
        {'>'}
      </PixelText>
      <PixelText
        size={12}
        pixelRatio={pixelRatio}
        color={cssHex(paletteFieldLight)}
      >{` ${props.label}`}</PixelText>
    </hstack>
  )
}
