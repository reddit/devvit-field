import {type CSSResult, css} from 'lit'

export const cssReset: CSSResult = css`
  *,
  *::after,
  *::before {
    box-sizing: border-box; /* Dimensions include any border and padding. */

    user-select: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none; /* to-do: Disable context menu on iOS? */
  }

  :host {
    font-family: 'Edit Undo BRK';
    /* All fonts are pixelated. */
    font-smooth: never;
    -webkit-font-smoothing : none;
  }

  button, input, select, textarea {
    font: inherit;
  }
`
