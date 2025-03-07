import {Devvit} from '@devvit/public-api'
import {
  consoleBase,
  cssHex,
  fallbackPixelRatio,
  paletteBlack,
} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
  levelShadowColor,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {GamesOnRedditBanner} from './GamesOnRedditBanner'
import {Scrim} from './Scrim'
import {StyledButton} from './StyledButton'

type DialogProps = {
  height?: number
  width?: number
  buttonLabel?: string
  onPress?: () => void
  pixelRatio: number
  children: JSX.Element | JSX.Element[]
  level: Level
  backgroundElement?: JSX.Element
}

export function Dialog(props: DialogProps): JSX.Element {
  const DEFAULT_HEIGHT = 240
  const DEFAULT_WIDTH = 288
  const pixelRatio = props.pixelRatio ?? fallbackPixelRatio
  const buttonLabel = props.buttonLabel ?? 'OK'
  const level = props.level ?? 0
  return (
    <zstack
      height='100%'
      width='100%'
      alignment='center middle'
      backgroundColor={cssHex(consoleBase)}
    >
      {/* Background Screen */}
      {props.backgroundElement ?? null}

      {/* Scrim */}
      <Scrim />

      {/* Content */}
      <vstack
        height='100%'
        width='100%'
        padding='medium'
        alignment='center middle'
      >
        <zstack alignment='top center'>
          <vstack padding='medium'>
            <BorderedContainer
              width={props.width ?? DEFAULT_WIDTH}
              height={props.height ?? DEFAULT_HEIGHT}
              pixelRatio={pixelRatio}
              padding='medium'
              backgroundColor={cssHex(levelShadowColor[level])}
              borderColor={cssHex(levelBaseColor[level])}
            >
              <spacer height='8px' />
              <vstack grow width='100%' alignment='center middle'>
                {props.children}
              </vstack>
            </BorderedContainer>
          </vstack>

          <vstack>
            <spacer height='7px' />
            <DialogBadge pixelRatio={pixelRatio} level={level} />
          </vstack>
        </zstack>

        <StyledButton
          color={cssHex(levelHighlightColor[level])}
          onPress={props.onPress}
        >
          {buttonLabel}
        </StyledButton>
        <spacer height='24px' />

        <GamesOnRedditBanner {...props} />
      </vstack>
    </zstack>
  )
}

/*
 * Field Badge on Dialog Top-Mid Boundary
 */

type DialogBadgeProps = {
  pixelRatio: number
  level?: Level
}

function DialogBadge(props: DialogBadgeProps): JSX.Element {
  const level = props.level ?? 0
  const SIZE = 24
  return (
    <image
      imageHeight={`${SIZE * props.pixelRatio}px`} // Raster size
      imageWidth={`${SIZE * props.pixelRatio}px`} // Raster size
      height={`${SIZE}px`} // Block size
      width={`${SIZE}px`} // Block size
      resizeMode='fill'
      description='r/Field Badge'
      url={`data:image/svg+xml;charset=UTF-8,
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<!-- Background -->
<path d="M19.1429 2H4.85714C3.27919 2 2 3.27919 2 4.85714V19.1429C2 20.7208 3.27919 22 4.85714 22H19.1429C20.7208 22 22 20.7208 22 19.1429V4.85714C22 3.27919 20.7208 2 19.1429 2Z" fill="${cssHex(
        paletteBlack,
      )}"/>

<!-- Border -->
<path fill-rule="evenodd" clip-rule="evenodd" d="M4.85714 0H19.1429C21.8254 0 24 2.17462 24 4.85714V19.1429C24 21.8254 21.8254 24 19.1429 24H4.85714C2.17462 24 0 21.8254 0 19.1429V4.85714C0 2.17462 2.17462 0 4.85714 0ZM4.85714 2H19.1429C20.7208 2 22 3.27919 22 4.85714V19.1429C22 20.7208 20.7208 22 19.1429 22H4.85714C3.27919 22 2 20.7208 2 19.1429V4.85714C2 3.27919 3.27919 2 4.85714 2Z" fill="${cssHex(
        levelBaseColor[level],
      )}"/>

<!-- Symbol -->
<path d="M14.0001 6H18V10.0001H14.0001V6Z M14.0001 10.0001L9.99988 10.0013V13.9999H6V18H9.99993V14.0015H13.9998L14.0001 10.0001Z M9.99993 6H6V10.0001L9.99988 10.0013L9.99993 6Z M14.0001 13.9999H18V18H14.0001V13.9999Z" fill="${cssHex(
        levelHighlightColor[level],
      )}"/>
</svg>`}
    />
  )
}
