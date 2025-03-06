import {Devvit} from '@devvit/public-api'
import {cssHex, paletteShade80} from '../../shared/theme'

type ScrimProps = {
  onPress?: () => void
}

export function Scrim(props: ScrimProps): JSX.Element {
  return (
    <vstack
      height='100%'
      width='100%'
      backgroundColor={cssHex(paletteShade80)}
      onPress={props.onPress}
    />
  )
}
