// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, svg} from '@devvit/public-api'
import {createBorderedContainer} from '../../shared/svg-factories/createBorderedContainer'
import {createCrtLines} from '../../shared/svg-factories/createCrtLines'
import {cssHex, paletteBlack, paletteFieldLight} from '../../shared/theme'

type BorderedContainerProps = {
  children: JSX.Element | JSX.Element[]
  height?: number
  width?: number
  pixelRatio: number
  backgroundColor?: Devvit.Blocks.ColorString
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
        url={svg`${createBorderedContainer({
          height,
          width,
          borderColor,
          backgroundColor,
        })}`}
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
          url={svg`${createCrtLines({height, width})}`}
        />
      )}
    </zstack>
  )
}
