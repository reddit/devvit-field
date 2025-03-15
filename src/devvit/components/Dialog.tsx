import {Devvit, svg} from '@devvit/public-api'
import {localize} from '../../shared/locale'
import {createDialogBadge} from '../../shared/svg-factories/createDialogBadge'
import {cssHex, paletteConsole} from '../../shared/theme'
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
  button?: boolean
  buttonLabel?: string
  buttonColor?: `#${string}`
  onPress?: () => void
  pixelRatio: number
  children: JSX.Element | JSX.Element[]
  level: Level
  backgroundElement?: JSX.Element
  marketing?: boolean
}

export function Dialog(props: DialogProps): JSX.Element {
  const DEFAULT_HEIGHT = 240
  const DEFAULT_WIDTH = 288
  const buttonLabel = props.buttonLabel ?? localize('dialog-button-label')
  const level = props.level ?? 0
  return (
    <zstack
      height='100%'
      width='100%'
      alignment='center middle'
      backgroundColor={cssHex(paletteConsole)}
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
              {...props}
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
            <spacer height='6px' />
            <DialogBadge {...props} level={level} />
          </vstack>
        </zstack>

        {props.button !== false && (
          <StyledButton
            color={
              props.buttonColor
                ? props.buttonColor
                : cssHex(levelHighlightColor[level])
            }
            {...props}
          >
            {buttonLabel}
          </StyledButton>
        )}

        {props.marketing !== false && (
          <>
            <spacer height='24px' />
            <GamesOnRedditBanner {...props} />
          </>
        )}
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
  const SIZE = 26
  return (
    <image
      imageHeight={`${SIZE * props.pixelRatio}px`} // Raster size
      imageWidth={`${SIZE * props.pixelRatio}px`} // Raster size
      height={`${SIZE}px`} // Block size
      width={`${SIZE}px`} // Block size
      resizeMode='fill'
      description='r/Field Badge'
      url={svg`${createDialogBadge(props.level ?? 0)}`}
    />
  )
}
