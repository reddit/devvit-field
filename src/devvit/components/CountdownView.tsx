import {Devvit} from '@devvit/public-api'
import {cssHex, paletteBlack} from '../../shared/theme'

type CountdownViewProps = {
  secondsLeft: number
  pixelRatio: number
}

export function CountdownView(props: CountdownViewProps): JSX.Element {
  const HEIGHT = 72
  const WIDTH_DIGIT = 60
  const WIDTH_DOT = 24
  const OVERLAP = 8

  const digits = parseDigits(props.secondsLeft)

  // Alternative text for screen readers
  const hoursAlt = `${(digits[0] ?? 0) + (digits[1] ?? 0)} hours`
  const minutesAlt = `${(digits[2] ?? 0) + (digits[3] ?? 0)} minutes`
  const secondsAlt = `${(digits[4] ?? 0) + (digits[5] ?? 0)} seconds`

  // Digits
  function digit(index: number, alt: string): JSX.Element {
    return (
      <image
        imageHeight={`${HEIGHT * props.pixelRatio}px`} // Raster size
        imageWidth={`${WIDTH_DIGIT * props.pixelRatio}px`} // Raster size
        height={`${HEIGHT}px`} // Block size
        width={`${WIDTH_DIGIT}px`} // Block size
        description={alt}
        url={`cd-${digits[index]}.png`}
      />
    )
  }

  // Dots
  const dot = (
    <image
      imageHeight={`${HEIGHT * props.pixelRatio}px`} // Raster size
      imageWidth={`${WIDTH_DOT * props.pixelRatio}px`} // Raster size
      height={`${HEIGHT}px`} // Block size
      width={`${WIDTH_DOT}px`} // Block size
      description='dot'
      resizeMode='fill'
      url='cd-dot.png'
    />
  )

  // The digit images include padding for the box shadow effect, adding an extra 8px of padding. To counteract this, we'll use zstacks with fixed sizes and aligned children instead of hstacks, as negative gaps are not supported in hstacks.

  const clock = (
    <NegativeMargin
      width={6 * WIDTH_DIGIT + 2 * WIDTH_DOT - 7 * OVERLAP}
      height={HEIGHT}
    >
      <NegativeMargin width={3 * WIDTH_DIGIT + WIDTH_DOT - 3 * OVERLAP}>
        <NegativeMargin width={WIDTH_DIGIT * 2 - OVERLAP}>
          {digit(0, hoursAlt)}
          {digit(1, hoursAlt)}
        </NegativeMargin>
        <NegativeMargin width={WIDTH_DIGIT + WIDTH_DOT - OVERLAP}>
          {dot}
          {digit(2, minutesAlt)}
        </NegativeMargin>
      </NegativeMargin>
      <NegativeMargin width={3 * WIDTH_DIGIT + WIDTH_DOT - 3 * OVERLAP}>
        <NegativeMargin width={WIDTH_DIGIT + WIDTH_DOT - OVERLAP}>
          {digit(3, minutesAlt)}
          {dot}
        </NegativeMargin>
        <NegativeMargin width={WIDTH_DIGIT * 2 - OVERLAP}>
          {digit(4, secondsAlt)}
          {digit(5, secondsAlt)}
        </NegativeMargin>
      </NegativeMargin>
    </NegativeMargin>
  )

  // Now just gotta sandwich up the final composite
  return (
    <zstack height='100%' width='100%'>
      {/* Background Gradient */}
      <image
        imageHeight='1024px'
        imageWidth='1024px'
        width='100%'
        height='100%'
        description='Background Gradient'
        url='console-background-gradient.png'
        resizeMode='fill'
      />

      {/* Inset Border */}
      <vstack height='100%' width='100%' padding='medium'>
        <vstack
          height='100%'
          width='100%'
          border='thin'
          borderColor={cssHex(paletteBlack)}
          cornerRadius='medium'
        />
      </vstack>

      {/* Console Illustration */}
      <image
        imageHeight='1024px'
        imageWidth='1640px'
        width='100%'
        height='100%'
        description='Console Illustration'
        url='countdown-illustration.png'
        resizeMode='cover'
      />

      {/* Clock */}
      <vstack height='100%' width='100%' alignment='top center'>
        <spacer height='88px' />
        {clock}
      </vstack>
    </zstack>
  )
}

type NegativeMarginProps = {
  height?: number
  width: number
  children: [JSX.Element, JSX.Element]
}

// lol, wha'chu gonna do?
function NegativeMargin(props: NegativeMarginProps): JSX.Element {
  return (
    <zstack
      width={`${props.width}px`}
      height={props.height ? `${props.height}px` : '100%'}
    >
      <hstack width='100%' height='100%' alignment='start'>
        {props.children[0]}
      </hstack>
      <hstack width='100%' height='100%' alignment='end'>
        {props.children[1]}
      </hstack>
    </zstack>
  )
}

/**
 * Parse the seconds left into an array of digits.
 * @param secondsLeft The number of seconds left.
 * @returns An array of six digits. The first two are hours, the second two are minutes, and the last two are seconds.
 */
function parseDigits(secondsLeft: number): number[] {
  const maxSeconds = 359999 // 99:59:59
  const minSeconds = 0
  let secs = Math.min(Math.max(secondsLeft, minSeconds), maxSeconds)
  const hours = Math.floor(secs / 3600)
  secs %= 3600
  const minutes = Math.floor(secs / 60)
  const remainingSeconds = secs % 60

  // Return the array with zero-padded values
  return [
    hours < 10 ? 0 : Math.floor(hours / 10),
    hours % 10,
    minutes < 10 ? 0 : Math.floor(minutes / 10),
    minutes % 10,
    remainingSeconds < 10 ? 0 : Math.floor(remainingSeconds / 10),
    remainingSeconds % 10,
  ]
}
