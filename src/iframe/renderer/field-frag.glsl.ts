export const fieldFragGLSL: string = `#version 300 es
precision highp float;

uniform mediump vec4 uCam;
uniform lowp usampler2D uCels;
uniform highp uint uFrame;
uniform uvec2 uFieldWH;
uniform mediump sampler2D uTex;
uniform mediump uvec2 uTexWH;
uniform highp usampler2D uField;
uniform highp usampler2D uMap;
uniform float uScale;
uniform highp uint uIDByColor[6];

in vec2 vUV;

out highp vec4 oFrag;

const vec4 bgTeam[] = vec4[](
  ${rgbaVec4(paletteBlack)},
  ${rgbaVec4(paletteTerminalGreen)}, // to-do: vary
  ${rgbaVec4(paletteFlamingo)},
  ${rgbaVec4(paletteJuiceBox)},
  ${rgbaVec4(paletteLasagna)},
  ${rgbaVec4(paletteSunshine)}
);

void main() {
  vec2 viewXY = vUV * uCam.zw * uScale;
  if (viewXY.x >= 0. && viewXY.x <= ${mapSize}. &&
      viewXY.y >= 0. && viewXY.y <= ${mapSize}.) {
    lowp uint box = texelFetch(uMap, ivec2(viewXY), 0).r;
    oFrag = bgTeam[box];
    return;
  }

  vec2 xy = vUV * uCam.zw + uCam.xy;
  if (
    xy.x < 0. || xy.x >= float(uFieldWH.x) ||
    xy.y < 0. || xy.y >= float(uFieldWH.y)
  )
    discard;

  vec2 fracXY = fract(xy);
  float borderW = 0.05;
  if (
    uScale >= 10. &&
    (fracXY.x < borderW || fracXY.x > 1.0 - borderW ||
     fracXY.y < borderW || fracXY.y > 1.0 - borderW)
  ) {
    oFrag = ${rgbaVec4(paletteGrid)};
    return;
  }

  lowp uint box = texelFetch(uField, ivec2(xy), 0).r;
  if (box == ${fieldArrayColorHidden}u || box == ${fieldArrayColorPending}u)
    discard;

  uint id = uIDByColor[box];
  mediump uvec4 texXYWH = texelFetch(uCels, ivec2(0, id), 0);
  // Hack: trim transparent one pixel off the border to be flush with grid.
  vec2 wh = vec2(texXYWH.z - 2u, texXYWH.w - 2u);
  highp vec2 px = vec2(texXYWH.x + 1u, texXYWH.y + 1u) + mod(xy * wh, wh);
  oFrag = texture(uTex, px / vec2(uTexWH));
}`

import {
  paletteBlack,
  paletteFlamingo,
  paletteGrid,
  paletteJuiceBox,
  paletteLasagna,
  paletteSunshine,
  paletteTerminalGreen,
} from '../../shared/theme.ts'
import {mapSize} from '../../shared/types/app-config.js'
import {fieldArrayColorHidden, fieldArrayColorPending} from './field-array.ts'

function rgbaVec4(rgba: number): string {
  const r = ((rgba >>> 24) & 0xff) / 0xff
  const g = ((rgba >>> 16) & 0xff) / 0xff
  const b = ((rgba >>> 8) & 0xff) / 0xff
  const a = ((rgba >>> 0) & 0xff) / 0xff
  return `vec4(${r}, ${g}, ${b}, ${a})`
}
