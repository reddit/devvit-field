import {Devvit} from '@devvit/public-api'
import {abbreviateNumber} from '../../shared/format'
import {
  cssHex,
  fontLSize,
  fontSSize,
  paletteBlack,
  paletteFieldLight,
} from '../../shared/theme'
import {PixelText} from './PixelText'

type StatTileProps = {
  label: string
  value: number
  pixelRatio: number
}

export function StatTile(props: StatTileProps): JSX.Element {
  return (
    <vstack
      width='33.332%'
      height='52px'
      backgroundColor={cssHex(paletteBlack)}
      alignment='center middle'
      border='thin'
      borderColor={cssHex(paletteFieldLight)}
    >
      <PixelText
        pixelRatio={props.pixelRatio}
        size={fontLSize}
        color={cssHex(paletteFieldLight)}
      >
        {abbreviateNumber(props.value)}
      </PixelText>
      <PixelText
        pixelRatio={props.pixelRatio}
        size={fontSSize}
        color={cssHex(paletteFieldLight)}
      >
        {props.label}
      </PixelText>
    </vstack>
  )
}
