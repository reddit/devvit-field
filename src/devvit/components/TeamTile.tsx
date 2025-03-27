import {Devvit} from '@devvit/public-api'
import {abbreviateNumber} from '../../shared/format'
import {cssHex, fontLSize, fontSSize, paletteBlack} from '../../shared/theme'
import {PixelText} from './PixelText'

type TeamTileProps = {
  key?: string
  label: string
  value: number
  color: `#${string}`
  pixelRatio: number
}

export function TeamTile(props: TeamTileProps): JSX.Element {
  return (
    <vstack
      width='25%'
      height='52px'
      backgroundColor={props.color}
      alignment='center middle'
      key={props.key ?? props.label}
    >
      <PixelText {...props} size={fontLSize} color={cssHex(paletteBlack)}>
        {abbreviateNumber(props.value)}
      </PixelText>
      <PixelText {...props} size={fontSSize} color={cssHex(paletteBlack)}>
        {props.label}
      </PixelText>
    </vstack>
  )
}
