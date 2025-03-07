import {Devvit} from '@devvit/public-api'
import {cssHex, paletteFieldLight, paletteWhite} from '../../shared/theme'
import {PixelText} from './PixelText'

type ListItemProps = {
  label: string
  pixelRatio: number
  symbol?: string
}

export function ListItem(props: ListItemProps): JSX.Element {
  const BULLET_SYMBOL = '>'
  const symbol = props.symbol ?? BULLET_SYMBOL
  return (
    <hstack>
      <PixelText size={12} {...props} color={cssHex(paletteWhite)}>
        {symbol}
      </PixelText>
      <PixelText
        size={12}
        {...props}
        color={cssHex(paletteFieldLight)}
      >{` ${props.label}`}</PixelText>
    </hstack>
  )
}
