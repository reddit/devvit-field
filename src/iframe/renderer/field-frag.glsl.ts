export const fieldFragGLSL: string = `#version 300 es
precision highp float;

uniform highp vec4 uCam;
uniform lowp usampler2D uCels;
uniform highp uint uFrame;
uniform mediump uvec2 uFieldWH;
uniform mediump sampler2D uTex;
uniform mediump uvec2 uTexWH;
uniform highp usampler2D uField;
uniform highp float uScale;
uniform highp uint uIDByColor[6];
uniform highp uint uGridRGBA;

in highp vec2 vUV;

out highp vec4 oFrag;

vec4 rgbaToVec4(uint rgba) {
  float r = float((rgba >> 24u) & 0xffu);
  float g = float((rgba >> 16u) & 0xffu);
  float b = float((rgba >>  8u) & 0xffu);
  float a = float( rgba         & 0xffu);
  return vec4(r / 255., g / 255., b / 255., a / 255.);
}

void main() {
  highp vec2 xy = vUV * uCam.zw + uCam.xy;
  if (
    xy.x < 0. || xy.x >= float(uFieldWH.x) ||
    xy.y < 0. || xy.y >= float(uFieldWH.y)
  )
    discard;

  highp vec2 fracXY = fract(xy);
  highp float borderW = 0.05;
  if (
    uScale >= 10. &&
    (fracXY.x < borderW || fracXY.x > 1.0 - borderW ||
     fracXY.y < borderW || fracXY.y > 1.0 - borderW)
  ) {
    oFrag = rgbaToVec4(uGridRGBA);
    return;
  }

  lowp uint color = texelFetch(uField, ivec2(xy), 0).r;
  if (color == ${fieldArrayColorHidden}u || color == ${fieldArrayColorPending}u)
    discard;

  lowp uint id = uIDByColor[color];
  mediump uvec4 texXYWH = texelFetch(uCels, ivec2(0, id), 0);
  // Hack: trim transparent one pixel off the border to be flush with grid.
  highp vec2 wh = vec2(texXYWH.z - 2u, texXYWH.w - 2u);
  highp vec2 px = vec2(texXYWH.x + 1u, texXYWH.y + 1u) + mod(xy * wh, wh);
  oFrag = texture(uTex, px / vec2(uTexWH));
}`

import {fieldArrayColorHidden, fieldArrayColorPending} from './field-array.ts'
