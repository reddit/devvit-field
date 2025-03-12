import {Devvit} from '@devvit/public-api'
import {
  lineBreakToken,
  localize,
  variableEndToken,
  variableStartToken,
} from '../../shared/locale'
import {type Team, teamTitleCase} from '../../shared/team'
import {cssHex, paletteBlack, paletteWhite} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
} from '../../shared/types/level'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText, getGlyphWidth} from './PixelText'

type DialogChallengeEndedAscendProps = {
  pixelRatio: number
  level: Level
  winningTeam: Team
}

export function DialogChallengeEndedAscend(
  props: DialogChallengeEndedAscendProps,
): JSX.Element {
  const size = 16
  const sharedProps = {
    size,
    color: cssHex(levelHighlightColor[props.level]),
    ...props,
  }

  return (
    <Dialog {...props} buttonLabel={localize('ascension-dialog-button-label')}>
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        {localize('ascension-dialog')
          .split(lineBreakToken)
          .map(copy => {
            const containsToken =
              copy.includes(variableStartToken) &&
              copy.includes(variableEndToken)

            if (containsToken) {
              const words = copy.split(' ')
              const tokenIndex = words.findIndex(word =>
                word.startsWith(variableStartToken),
              )

              const pre = words.slice(0, tokenIndex).join(' ')
              const post = words.slice(tokenIndex + 1).join(' ')

              return (
                <hstack>
                  {pre.length > 0 && (
                    <>
                      <PixelText key={copy} {...sharedProps}>
                        {pre}
                      </PixelText>
                      <spacer width={`${getGlyphWidth(size)}px`} />
                    </>
                  )}

                  <PixelText {...sharedProps} color={cssHex(paletteWhite)}>
                    {teamTitleCase[0].toUpperCase()}
                  </PixelText>

                  {post.length > 0 && (
                    <>
                      <spacer width={`${getGlyphWidth(size)}px`} />
                      <PixelText key={copy} {...sharedProps}>
                        {post}
                      </PixelText>
                    </>
                  )}
                </hstack>
              )
            }

            return (
              <PixelText key={copy} {...sharedProps}>
                {copy}
              </PixelText>
            )
          }) ?? null}
      </BorderedContainer>
    </Dialog>
  )
}
