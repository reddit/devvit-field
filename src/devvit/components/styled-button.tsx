// biome-ignore lint/style/useImportType: <explanation>
import {Devvit} from '@devvit/public-api'

import {cssHex, leaderboardButton, paletteBlack} from '../../shared/theme'
import {Shadow} from './Shadow.js'

// const styles = {
//   primary: {
//     backgroundColor: leaderboardButton,
//     borderColor: paletteBlack,
//     color: paletteHalfShade,
//   },
// };

interface StyledButtonProps {
  onPress?: () => void | Promise<void>
  label?: string
  width?: Devvit.Blocks.SizeString
  height?: Devvit.Blocks.SizeString
}

export const StyledButton = (props: StyledButtonProps): JSX.Element => {
  const {onPress, label: _label, width = '100px', height = '40px'} = props

  return (
    <Shadow height={height} width={width}>
      <hstack
        height={height}
        width={width}
        onPress={onPress}
        backgroundColor={cssHex(paletteBlack)}
        padding='xsmall'
      >
        <hstack
          height='100%'
          width='100%'
          gap='small'
          alignment='middle center'
          backgroundColor={cssHex(leaderboardButton)}
          cornerRadius='small'
        >
          <image
            url='play-field.png'
            imageWidth={380}
            imageHeight={32}
            height='64%'
            width='50%'
          />
        </hstack>
      </hstack>
    </Shadow>
  )
}
