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
  paletteBlandBlue,
  paletteConsole,
  paletteField,
  paletteFieldDark,
  paletteFieldLight,
  paletteFlamingo,
  paletteJuiceBox,
  paletteLasagna,
  paletteShade19,
  paletteShade50,
  paletteShade60,
  paletteShade80,
  paletteSunshine,
  paletteTint75,
  paletteVeryBannedField,
  paletteVeryBannedFieldDark,
  paletteVeryBannedFieldLight,
  paletteWhatIsField,
  paletteWhatIsFieldDark,
  paletteWhatIsFieldLight,
  paletteWhite,
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
    /* to-do: move hardcodes to theme.ts. */
    --color-banana-field-dark: ${unsafeCSS(cssHex(paletteBananaFieldDark))};
    --color-banana-field-light: ${unsafeCSS(cssHex(paletteBananaFieldLight))};
    --color-banana-field: ${unsafeCSS(cssHex(paletteBananaField))};
    --color-banned-field-dark: ${unsafeCSS(cssHex(paletteBannedFieldDark))};
    --color-banned-field-light: ${unsafeCSS(cssHex(paletteBannedFieldLight))};
    --color-banned-field: ${unsafeCSS(cssHex(paletteBannedField))};
    --color-black: ${unsafeCSS(cssHex(paletteBlack))};
    --color-bland-blue: ${unsafeCSS(cssHex(paletteBlandBlue))};
    --color-console: ${unsafeCSS(cssHex(paletteConsole))};
    --color-field-dark: ${unsafeCSS(cssHex(paletteFieldDark))};
    --color-field-light: ${unsafeCSS(cssHex(paletteFieldLight))};
    --color-field: ${unsafeCSS(cssHex(paletteField))};
    --color-flamingo-dark: #9a2564;
    --color-flamingo-light: #df659f;
    --color-flamingo: ${unsafeCSS(cssHex(paletteFlamingo))};
    --color-another-grey: #3a3a3a;
    --color-grey: #696969;
    --color-juice-box-dark: #5772c9;
    --color-juice-box-light: #91b1ff;
    --color-juice-box: ${unsafeCSS(cssHex(paletteJuiceBox))};
    --color-lasagna-dark: #b84a13;
    --color-lasagna-light: #fd8859;
    --color-lasagna: ${unsafeCSS(cssHex(paletteLasagna))};
    --color-shade-19: ${unsafeCSS(cssHex(paletteShade19))};
    --color-shade-50: ${unsafeCSS(cssHex(paletteShade50))};
    --color-shade-60: ${unsafeCSS(cssHex(paletteShade60))};
    --color-shade-80: ${unsafeCSS(cssHex(paletteShade80))};
    --color-sunshine-dark: #c18a28;
    --color-sunshine-light: #ffc96f;
    --color-sunshine: ${unsafeCSS(cssHex(paletteSunshine))};
    --color-tint-75: ${unsafeCSS(cssHex(paletteTint75))};
    --color-very-banned-field-dark: ${unsafeCSS(cssHex(paletteVeryBannedFieldDark))};
    --color-very-banned-field-light: ${unsafeCSS(cssHex(paletteVeryBannedFieldLight))};
    --color-very-banned-field: ${unsafeCSS(cssHex(paletteVeryBannedField))};
    --color-what-is-field-dark: ${unsafeCSS(cssHex(paletteWhatIsFieldDark))};
    --color-what-is-field-light: ${unsafeCSS(cssHex(paletteWhatIsFieldLight))};
    --color-what-is-field: ${unsafeCSS(cssHex(paletteWhatIsField))};
    --color-white: ${unsafeCSS(cssHex(paletteWhite))};

    font-family: 'Departure Mono';
    /* All fonts are pixelated. */
    font-smooth: never;
    -webkit-font-smoothing : none;
  }

  button, input, select, textarea {
    font: inherit;
  }
`
