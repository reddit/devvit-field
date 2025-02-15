export const fieldFragGLSL: string = `#version 300 es
precision highp float;

uniform mediump vec4 uCam;
uniform uvec2 uFieldWH;
uniform highp usampler2D uTex;
uniform float uScale;

in vec2 vUV;

out highp vec4 oFrag;

const vec4 palette[] = vec4[](
  ${rgbaVec4(paletteBlack)},
  ${rgbaVec4(paletteBanBox)},
  ${rgbaVec4(paletteJuiceBox)},
  ${rgbaVec4(paletteFlamingo)},
  ${rgbaVec4(paletteLasagna)},
  ${rgbaVec4(paletteSunshine)}
);

void main() {
  vec2 screenXY = vUV * uCam.zw;
  vec2 xy = (screenXY / uScale) + uCam.xy;
  if (xy.x < 0. || xy.x >= float(uFieldWH.x) || xy.y < 0. || xy.y >= float(uFieldWH.y))
    discard;

  vec2 fracXY = fract(xy);
  float borderW = 0.1;
  if (uScale >= 10. &&
      (fracXY.x < borderW || fracXY.x > 1.0 - borderW ||
       fracXY.y < borderW || fracXY.y > 1.0 - borderW)) {
    oFrag = ${rgbaVec4(paletteBlack)};
    return;
  }

  lowp uint box = texelFetch(uTex, ivec2(xy), 0).r;
  oFrag = palette[box];
}`

import {
  paletteBanBox,
  paletteBlack,
  paletteFlamingo,
  paletteJuiceBox,
  paletteLasagna,
  paletteSunshine,
} from '../../shared/theme.ts'

function rgbaVec4(rgba: number): string {
  const r = ((rgba >>> 24) & 0xff) / 0xff
  const g = ((rgba >>> 16) & 0xff) / 0xff
  const b = ((rgba >>> 8) & 0xff) / 0xff
  const a = ((rgba >>> 0) & 0xff) / 0xff
  return `vec4(${r}, ${g}, ${b}, ${a})`
}
