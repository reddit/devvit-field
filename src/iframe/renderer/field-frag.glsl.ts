export const fieldFragGLSL: string = `#version 300 es
precision highp float;

uniform mediump vec4 uCam;
uniform lowp usampler2D uCels;
uniform highp uint uFrame;
uniform uvec2 uFieldWH;
uniform mediump sampler2D uTex;
uniform highp usampler2D uBoxes;
uniform mediump uvec2 uTexWH;
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

  lowp uint box = texelFetch(uBoxes, ivec2(xy), 0).r;
  bool select = ((box >> ${fieldArraySelectShift}) & ${fieldArraySelectMask}u) == ${fieldArraySelectOn}u;
  bool pend = ((box >> ${fieldArrayPendShift}) & ${fieldArrayPendMask}u) == ${fieldArrayPendOn}u;
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

  if (ban) {
    int id = 48;
    int frame = 0;
    mediump uvec4 texXYWH = texelFetch(uCels, ivec2(0, id + frame), 0);
    highp vec2 px = vec2(texXYWH.xy* uvec2(24, 24)) + mod(xy* vec2(24, 24), vec2(texXYWH.zw));
    oFrag = texture(uTex, (px) / vec2(uTexWH));

    return;
  }

  if (pend) {
    oFrag = ${rgbaVec4(palettePending)};
    return;
  }

  if (!visible) {
    oFrag = ${rgbaVec4(paletteBlack)};
    return;
  }

  oFrag = bgTeam[team];
}`

import {
  paletteBlack,
  paletteFlamingo,
  paletteGrid,
  paletteJuiceBox,
  paletteLasagna,
  palettePending,
  paletteSunshine,
  paletteTerminalGreen,
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
