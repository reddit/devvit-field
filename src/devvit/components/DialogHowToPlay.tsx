import {Devvit} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {cssHex, paletteBlack} from '../../shared/theme'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'

type DialogHowToPlayProps = {
  pixelRatio: number
  onPress: () => void
}

export function DialogHowToPlay(props: DialogHowToPlayProps): JSX.Element {
  const width = 256
  const height = 200
  const resolution = 2

  return (
    <Dialog
      level={0}
      {...props}
      buttonLabel={localize('how-to-play-dialog-button-label')}
    >
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        backgroundColor={cssHex(paletteBlack)}
        padding='none'
        lines
      >
        <vstack height='100%' width='100%' alignment='center middle'>
          <image
            imageWidth={`${width * resolution}px`} // Raster size
            imageHeight={`${height * resolution}px`} // Raster size
            height={`${height}px`} // Block size
            width={`${width}px`} // Block size
            description='How to play illustration: 1. Click a cell to select. 2. Click the claim button. 3. Win?'
            resizeMode='fill'
            url='how-to-play-illustration.png'
          />
        </vstack>
      </BorderedContainer>
    </Dialog>
  )
}
