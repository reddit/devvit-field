import {Devvit} from '@devvit/public-api'
import {playButtonWidth} from '../../shared/theme.ts'
import {Title} from './title.tsx'

// to-do: pass seed data by props.
export function Preview(): JSX.Element {
  return (
    <Title>
      <vstack alignment='middle center' width={`${playButtonWidth}px`}>
        {/* to-do: theme loading.gif. */}
        <image
          url='loading.gif'
          description='loading…'
          height='60px'
          width='60px'
          imageHeight='240px'
          imageWidth='240px'
        />
      </vstack>
    </Title>
  )
}
