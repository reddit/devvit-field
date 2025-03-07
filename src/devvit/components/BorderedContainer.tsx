// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {cssHex, paletteBlack, paletteFieldLight} from '../../shared/theme'

type BorderedContainerProps = {
  children: JSX.Element | JSX.Element[]
  height?: number
  width?: number
  pixelRatio: number
  backgroundColor?: Devvit.Blocks.ColorString
  shadow?: boolean
  borderColor?: Devvit.Blocks.ColorString
  lines?: boolean
  alignment?: Devvit.Blocks.Alignment
  padding?: Devvit.Blocks.ContainerPadding
}

export function BorderedContainer(props: BorderedContainerProps): JSX.Element {
  const height = props.height ?? 256
  const width = props.width ?? 300
  const backgroundColor = props.backgroundColor ?? cssHex(paletteBlack)
  const borderColor = props.borderColor ?? cssHex(paletteFieldLight)
  const lines = props.lines ?? false

  const crtLines: string[] = []
  if (lines) {
    for (let i = 6; i < height - 6; i += 2) {
      crtLines.push(
        `<line x1="6" y1="${i}" x2="${width - 6}" y2="${i}" stroke="${cssHex(
          paletteBlack,
        )}" stroke-width="0.5"/>`,
      )
    }
  }

  return (
    <zstack width={`${width}px`} height={`${height}px`}>
      {/* Container Background + Border */}
      <image
        imageHeight={Math.ceil(height * props.pixelRatio)}
        imageWidth={Math.ceil(width * props.pixelRatio)}
        width='100%'
        height='100%'
        description={`"${props.children}" button`}
        resizeMode='fit'
        url={`data:image/svg+xml;charset=UTF-8,
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">

<!-- Background -->
<rect x="4" y="4" width="${width - 8}" height="${
          height - 8
        }" fill="${backgroundColor}"/>

<!-- Top Left Corner -->
<path transform="translate(2 2)" d="M4 0V2H2V4H0V6H4V4H6V0H4Z" fill="${borderColor}"/>

<!-- Top Right Corner -->
<path transform="translate(${
          width - 8
        } 2)" d="M2 0V2H4V4H6V6H2V4H0V0H2Z" fill="${borderColor}"/>

<!-- Bottom Right Corner -->
<path transform="translate(${width - 8} ${
          height - 8
        })" d="M2 6V4H4V2H6V0H2V2H0V6H2Z" fill="${borderColor}"/>

<!-- Bottom Left Corner -->
<path transform="translate(2 ${
          height - 8
        })" d="M4 6V4H2V2H0V0H4V2H6V6H4Z" fill="${borderColor}"/>

<!-- BORDER STRAIGHT LINES -->
<rect x="6" y="2" width="${width - 12}" height="2" fill="${borderColor}"/>
<rect x="${width - 4}" y="6" width="2" height="${
          height - 12
        }" fill="${borderColor}"/>
<rect x="6" y="${height - 4}" width="${
          width - 12
        }" height="2" fill="${borderColor}"/>
<rect x="2" y="6" width="2" height="${height - 12}" fill="${borderColor}"/>


<!-- SHADOW -->
<path transform="translate(${width - 6} ${
          height - 6
        })" d="M2 6V4H4V2H6V0H2V2H0V6H2Z" fill="${cssHex(paletteBlack)}"/>
<rect x="${width - 2}" y="8" width="2" height="${height - 14}" fill="${cssHex(
          paletteBlack,
        )}"/>
<rect x="8" y="${height - 2}" width="${width - 14}" height="2" fill="${cssHex(
          paletteBlack,
        )}"/>
</svg>`}
      />

      <vstack
        height='100%'
        width='100%'
        padding={props.padding ?? 'medium'}
        alignment={props.alignment ?? 'center middle'}
      >
        {props.children}
      </vstack>

      {/* CRT Lines */}
      {lines && (
        <image
          imageHeight={Math.ceil(height * props.pixelRatio)}
          imageWidth={Math.ceil(width * props.pixelRatio)}
          width='100%'
          height='100%'
          description={`"${props.children}" button`}
          resizeMode='fit'
          url={`data:image/svg+xml;charset=UTF-8,
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${crtLines.join('')}
</svg>`}
        />
      )}
    </zstack>
  )
}
