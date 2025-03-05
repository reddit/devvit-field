// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'
import {cssHex, paletteShade50} from '../../shared/theme'

interface ShadowProps {
  height: Devvit.Blocks.SizeString
  width: Devvit.Blocks.SizeString
  children: JSX.Element
  onPress?: () => void
}

export const Shadow = (props: ShadowProps): JSX.Element => {
  const {height, width, children, onPress} = props

  return (
    <zstack alignment='start top' onPress={onPress}>
      {/* Shadow */}
      <vstack width='100%' height='100%'>
        <spacer height='4px' />
        <hstack width='100%' height='100%'>
          <spacer width='4px' />
          <hstack
            height={height}
            width={width}
            backgroundColor={cssHex(paletteShade50)}
          />
        </hstack>
      </vstack>

      {/* Card */}
      {children}
    </zstack>
  )
}
