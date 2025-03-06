import {Devvit} from '@devvit/public-api'
import {
  cssHex,
  fallbackPixelRatio,
  paletteFieldLight,
  paletteWhite,
} from '../../shared/theme'
import {PixelText} from './PixelText'

type ListItemProps = {
  label: string
  pixelRatio?: number
  symbol?: string
}

export function ListItem(props: ListItemProps): JSX.Element {
  const BULLET_SYMBOL = '>'
  const symbol = props.symbol ?? BULLET_SYMBOL
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio
  return (
    <hstack>
      <PixelText size={12} pixelRatio={pixelRatio} color={cssHex(paletteWhite)}>
        {symbol}
      </PixelText>
      <PixelText
        size={12}
        pixelRatio={pixelRatio}
        color={cssHex(paletteFieldLight)}
      >{` ${props.label}`}</PixelText>
    </hstack>
  )
}
