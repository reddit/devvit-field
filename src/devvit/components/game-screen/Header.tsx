import {Devvit, svg} from '@devvit/public-api'
import {localize} from '../../../shared/locale'
import type {Team} from '../../../shared/team'
import {
  cssHex,
  paletteBlack,
  paletteField,
  paletteFieldLight,
  paletteTint60,
} from '../../../shared/theme'
import {PixelText} from '../PixelText'

type HeaderProps = {
  pixelRatio: number
  team: Team
  scores: {member: Team; score: number}[]
  onPress?: () => void
}

export function Header(props: HeaderProps): JSX.Element {
  const borderColor = cssHex(paletteField)
  const CAP_HEIGHT = 48
  const CAP_WIDTH = 48
  const RADIUS = 8

  const leftCapSegments = [
    `M${CAP_HEIGHT},0`,
    `H${RADIUS}`,
    `Q0,0 0,${RADIUS}`,
    `V${CAP_HEIGHT}`,
    `H${CAP_WIDTH}`,
  ]

  const rightCapSegments = [
    'M0,0',
    `H${CAP_WIDTH - RADIUS}`,
    `Q${CAP_WIDTH},0 ${CAP_WIDTH},${RADIUS}`,
    `V${CAP_HEIGHT}`,
    'H0',
  ]

  const background = (
    <hstack height={`${CAP_HEIGHT}px`} width='100%'>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height='100%'
        description='Background: Left Cap'
        url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${leftCapSegments.join('')}" fill="${cssHex(paletteBlack)}" stroke-width="2" stroke="${borderColor}" /></svg>`}
      />
      <vstack height='100%' grow backgroundColor={cssHex(paletteBlack)}>
        <hstack height='1px' width='100%' backgroundColor={borderColor} />
        <spacer grow />
        <hstack height='1px' width='100%' backgroundColor={borderColor} />
      </vstack>
      <image
        imageWidth={CAP_WIDTH * props.pixelRatio}
        imageHeight={CAP_HEIGHT * props.pixelRatio}
        width={`${CAP_WIDTH}px`}
        height='100%'
        description='Background: Right Cap'
        url={svg`<svg viewBox="0 0 ${CAP_WIDTH} ${CAP_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${rightCapSegments.join('')}" fill="${cssHex(paletteBlack)}" stroke-width="2" stroke="${borderColor}" /></svg>`}
      />
    </hstack>
  )

  const topRow = (
    <hstack alignment='middle'>
      <PixelText {...props} size={16} color={cssHex(paletteFieldLight)}>
        {localize('point-claim-title')}
      </PixelText>
      <spacer grow />
      <hstack
        height='16px'
        width='16px'
        alignment='center middle'
        borderColor={cssHex(paletteTint60)}
        cornerRadius='full'
      >
        <PixelText {...props} size={12} color={cssHex(paletteTint60)}>
          ?
        </PixelText>
      </hstack>
    </hstack>
  )

  return (
    <zstack width='100%' height={`${CAP_HEIGHT}px`} onPress={props.onPress}>
      {background}
      <hstack width='100%' height='100%'>
        <spacer width='8px' />
        <vstack grow height='100%' alignment='middle'>
          {topRow}
          <spacer height='2px' />
          <spacer height='12px' />
        </vstack>
        <spacer width='8px' />
      </hstack>
    </zstack>
  )
}
