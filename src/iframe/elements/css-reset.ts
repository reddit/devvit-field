import {type CSSResult, css, unsafeCSS} from 'lit'
import {
  cssHex,
  paletteBlack,
  paletteFlamingo,
  paletteJuiceBox,
  paletteLasagna,
  paletteSunshine,
} from '../../shared/theme.ts'

export const cssReset: CSSResult = css`
  *,
  *::after,
  *::before {
    box-sizing: border-box; /* Dimensions include any border and padding. */

    user-select: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none; /* to-do: Disable context menu on iOS? */
  }

  * {
    margin: 0;
  }

  :host {
    --color-black: ${unsafeCSS(cssHex(paletteBlack))};
    --color-grey: #696969;
    --color-flamingo: ${unsafeCSS(cssHex(paletteFlamingo))};
    --color-flamingo-dark: #9a2564;
    --color-flamingo-light: #df659f;
    --color-juice-box: ${unsafeCSS(cssHex(paletteJuiceBox))};
    --color-juice-box-dark: #5772c9;
    --color-juice-box-light: #91b1ff;
    --color-lasagna: ${unsafeCSS(cssHex(paletteLasagna))};
    --color-lasagna-dark: #b84a13;
    --color-lasagna-light: #fd8859;
    --color-sunshine: ${unsafeCSS(cssHex(paletteSunshine))};
    --color-sunshine-dark: #c18a28;
    --color-sunshine-light: #ffc96f;

    font-family: 'Departure Mono';
    /* All fonts are pixelated. */
    font-smooth: never;
    -webkit-font-smoothing : none;
  }

  button, input, select, textarea {
    font: inherit;
  }
`
