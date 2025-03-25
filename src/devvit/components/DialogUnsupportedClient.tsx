// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {lineBreakToken, localize} from '../../shared/locale'
import {cssHex, fontMSize, paletteBlack} from '../../shared/theme'
import {
  type Level,
  levelBaseColor,
  levelHighlightColor,
} from '../../shared/types/level'
import {
  type ParsedDevvitUserAgent,
  getUpgradeLinkForPlatform,
} from '../appUpgradeUtils'
import {BorderedContainer} from './BorderedContainer'
import {Dialog} from './Dialog'
import {PixelText} from './PixelText'

type DialogUnsupportedClientProps = {
  pixelRatio: number
  level: Level
  platform: ParsedDevvitUserAgent['platform']
}

export function DialogUnsupportedClient(
  props: DialogUnsupportedClientProps,
  ctx: Devvit.Context,
): JSX.Element {
  const sharedProps = {
    size: fontMSize,
    color: cssHex(levelHighlightColor[props.level]),
    ...props,
  }

  return (
    <Dialog
      {...props}
      marketing={false}
      buttonLabel='Upgrade'
      onPress={() => {
        const upgradeLink = getUpgradeLinkForPlatform(props.platform)

        if (upgradeLink) {
          ctx.ui.navigateTo(upgradeLink)
        }
      }}
    >
      <BorderedContainer
        height={200}
        width={256}
        {...props}
        lines
        backgroundColor={cssHex(paletteBlack)}
        borderColor={cssHex(levelBaseColor[props.level])}
      >
        {localize('unsupported-client-dialog')
          .split(lineBreakToken)
          .map(copy => (
            <PixelText key={copy} {...sharedProps}>
              {copy}
            </PixelText>
          )) ?? null}
      </BorderedContainer>
    </Dialog>
  )
}
