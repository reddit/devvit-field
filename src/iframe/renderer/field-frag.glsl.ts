export const fieldFragGLSL: string = `#version 300 es
precision highp float;

uniform mediump vec4 uCam;
uniform uvec2 uFieldWH;
uniform highp usampler2D uTex;
uniform float uScale;

in vec2 vUV;

out highp vec4 oFrag;

const vec4 bgTeam[] = vec4[](
  ${rgbaVec4(paletteFlamingo)},
  ${rgbaVec4(paletteJuiceBox)},
  ${rgbaVec4(paletteLasagna)}, 
  ${rgbaVec4(paletteSunshine)}
);

void main() {
  vec2 xy = vUV * uCam.zw + uCam.xy;
  if (
    xy.x < 0. || xy.x >= float(uFieldWH.x) ||
    xy.y < 0. || xy.y >= float(uFieldWH.y)
  )
    discard;

  vec2 fracXY = fract(xy);
  float borderW = 0.02;
  if (
    uScale >= 10. &&
    (fracXY.x < borderW || fracXY.x > 1.0 - borderW ||
     fracXY.y < borderW || fracXY.y > 1.0 - borderW)
  ) {
    oFrag = ${rgbaVec4(paletteGrid)};
    return;
  }

  lowp uint box = texelFetch(uTex, ivec2(xy), 0).r;
  bool select = ((box >> ${fieldArraySelectShift}) & ${fieldArraySelectMask}u) == ${fieldArraySelectOn}u;
  bool pend = ((box >> ${fieldArrayPendShift}) & ${fieldArrayPendMask}u) == ${fieldArrayPendOn}u;
  bool user = ((box >> ${fieldArrayUserShift}) & ${fieldArrayUserMask}u) == ${fieldArrayUserOn}u;
  bool visible = ((box >> ${fieldArrayVisibleShift}) & ${fieldArrayVisibleMask}u) == ${fieldArrayVisibleOn}u;
  bool ban = ((box >> ${fieldArrayBanShift}) & ${fieldArrayBanMask}u) == ${fieldArrayBanOn}u;
  lowp uint team = ((box >> ${fieldArrayTeamShift}) & ${fieldArrayTeamMask}u);

  borderW = .1;
  if (select &&
      (fracXY.x < borderW || fracXY.x > 1.0 - borderW ||
       fracXY.y < borderW || fracXY.y > 1.0 - borderW)
  ) {
    oFrag = ${rgbaVec4(paletteTerminalGreen)};
    return;
  }

  if (!visible) {
    oFrag = ${rgbaVec4(paletteBlack)};
    return;
  }

  if (ban) {
    oFrag = ${rgbaVec4(paletteBanBox)};
    return;
  }

  if (pend) {
    oFrag = ${rgbaVec4(palettePending)};
    return;
  }

  // to-do: user.

  oFrag = bgTeam[team];
}`

import {
  paletteBanBox,
  paletteBlack,
  paletteFlamingo,
  paletteGrid,
  paletteJuiceBox,
  paletteLasagna,
  palettePending,
  paletteTerminalGreen,
  paletteSunshine,
} from '../../shared/theme.ts'
import {
  fieldArrayBanMask,
  fieldArrayBanOn,
  fieldArrayBanShift,
  fieldArrayPendMask,
  fieldArrayPendOn,
  fieldArrayPendShift,
  fieldArraySelectMask,
  fieldArraySelectOn,
  fieldArraySelectShift,
  fieldArrayTeamMask,
  fieldArrayTeamShift,
  fieldArrayUserMask,
  fieldArrayUserOn,
  fieldArrayUserShift,
  fieldArrayVisibleMask,
  fieldArrayVisibleOn,
  fieldArrayVisibleShift,
} from './field-array.ts'

function rgbaVec4(rgba: number): string {
  const r = ((rgba >>> 24) & 0xff) / 0xff
  const g = ((rgba >>> 16) & 0xff) / 0xff
  const b = ((rgba >>> 8) & 0xff) / 0xff
  const a = ((rgba >>> 0) & 0xff) / 0xff
  return `vec4(${r}, ${g}, ${b}, ${a})`
}
