import {type CSSResult, css, unsafeCSS} from 'lit'
import {
  cssHex,
  paletteBananaField,
  paletteBananaFieldDark,
  paletteBananaFieldLight,
  paletteBannedField,
  paletteBannedFieldDark,
  paletteBannedFieldLight,
  paletteBlack,
  paletteField,
  paletteFieldDark,
  paletteFieldLight,
  paletteFlamingo,
  paletteJuiceBox,
  paletteLasagna,
  paletteSunshine,
  paletteVeryBannedField,
  paletteVeryBannedFieldDark,
  paletteVeryBannedFieldLight,
  paletteWhatIsField,
  paletteWhatIsFieldDark,
  paletteWhatIsFieldLight,
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
    --color-field: ${unsafeCSS(cssHex(paletteField))};
    --color-field-light: ${unsafeCSS(cssHex(paletteFieldLight))};
    --color-field-dark: ${unsafeCSS(cssHex(paletteFieldDark))};
    --color-banned-field: ${unsafeCSS(cssHex(paletteBannedField))};
    --color-banned-field-light: ${unsafeCSS(cssHex(paletteBannedFieldLight))};
    --color-banned-field-dark: ${unsafeCSS(cssHex(paletteBannedFieldDark))};
    --color-very-banned-field: ${unsafeCSS(cssHex(paletteVeryBannedField))};
    --color-very-banned-field-light: ${unsafeCSS(cssHex(paletteVeryBannedFieldLight))};
    --color-very-banned-field-dark: ${unsafeCSS(cssHex(paletteVeryBannedFieldDark))};
    --color-banana-field: ${unsafeCSS(cssHex(paletteBananaField))};
    --color-banana-field-light: ${unsafeCSS(cssHex(paletteBananaFieldLight))};
    --color-banana-field-dark: ${unsafeCSS(cssHex(paletteBananaFieldDark))};
    --color-what-is-field: ${unsafeCSS(cssHex(paletteWhatIsField))};
    --color-what-is-field-light: ${unsafeCSS(cssHex(paletteWhatIsFieldLight))};
    --color-what-is-field-dark: ${unsafeCSS(cssHex(paletteWhatIsFieldDark))};

    font-family: 'Departure Mono';
    /* All fonts are pixelated. */
    font-smooth: never;
    -webkit-font-smoothing : none;
  }

  button, input, select, textarea {
    font: inherit;
  }
`
