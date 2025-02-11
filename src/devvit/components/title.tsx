import {Devvit} from '@devvit/public-api'
import {cssHex, paletteBlack} from '../../shared/theme.ts'

export type TitleProps = {loaded: boolean; children?: JSX.Children}

export function Title(props: Readonly<TitleProps>): JSX.Element {
  return (
    <zstack
      alignment='middle center'
      backgroundColor={cssHex(paletteBlack)}
      width='100%'
      height='100%'
    >
      {!props.loaded && (
        <image
          url='loading.gif'
          description='loading…'
          imageWidth='233px'
          imageHeight='235px'
          width='233px'
          height='235px'
        />
      )}
      {props.children ?? null}
    </zstack>
  )
}
