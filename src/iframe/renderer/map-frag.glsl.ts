export const mapFragGLSL: string = `#version 300 es
precision highp float;

uniform highp usampler2D uMap;
uniform highp float uSize;
uniform highp uint uRGBAByColor[6];

in vec2 vXY;

out highp vec4 oFrag;

vec4 rgbaToVec4(uint rgba) {
  float r = float((rgba >> 24u) & 0xffu);
  float g = float((rgba >> 16u) & 0xffu);
  float b = float((rgba >>  8u) & 0xffu);
  float a = float( rgba         & 0xffu);
  return vec4(r / 255., g / 255., b / 255., a / 255.);
}

void main() {
  // if (int(vXY.x) % 10 == 0 || int(vXY.y) % 10 == 0) {
  if (
    vXY.x <= 1. || vXY.x >= (uSize - 1.) ||
    vXY.y <= 1. || vXY.y >= (uSize - 1.)
  ) {
    oFrag = rgbaToVec4(uRGBAByColor[1]);
    return;
  }

  lowp uint color = texelFetch(uMap, ivec2(vXY * ${mapSize}. / uSize), 0).r;
  oFrag = rgbaToVec4(uRGBAByColor[color]);
}`

import {mapSize} from '../../shared/types/app-config.js'
