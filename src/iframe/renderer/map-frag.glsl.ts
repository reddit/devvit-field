export const mapFragGLSL: string = `#version 300 es
precision highp float;

uniform highp usampler2D uMap;
uniform highp float uSize;
uniform highp float uBorderW;
uniform highp uint uRGBAByColor[6];
uniform highp ivec4 uViewfinder;

in vec2 vXY;

out highp vec4 oRGBA;

vec4 rgbaToVec4(highp uint rgba) {
  float r = float((rgba >> 24u) & 0xffu);
  float g = float((rgba >> 16u) & 0xffu);
  float b = float((rgba >>  8u) & 0xffu);
  float a = float( rgba         & 0xffu);
  return vec4(r / 255., g / 255., b / 255., a / 255.);
}

void main() {
  mediump int borderW = int(uBorderW);
  mediump ivec2 intXY = ivec2(vXY);
  mediump ivec2 intXY2 = ivec2(vXY);
  ivec4 viewfinder = ivec4(uBorderW, uBorderW, 0, 0) + uViewfinder;
  if (
    (intXY.x == borderW || intXY.x == (borderW + int(uSize) - 1) ||
    intXY.y == borderW || intXY.y == (borderW + int(uSize) - 1) ||
    intXY2.x >= viewfinder.x && intXY2.x <= (viewfinder.x + viewfinder.z) &&
    (intXY2.y == viewfinder.y || intXY2.y == (viewfinder.y + viewfinder.w)) ||
    intXY2.y >= viewfinder.y && intXY2.y <= (viewfinder.y + viewfinder.w) &&
    (intXY2.x == viewfinder.x || intXY2.x == (viewfinder.x + viewfinder.z))) &&
    intXY.x >= borderW && intXY.x < (borderW + int(uSize)) && 
    intXY.y >= borderW && intXY.y < (borderW + int(uSize))
  ) {
    oRGBA = rgbaToVec4(uRGBAByColor[2]);
    return;
  }

  if (
    intXY.x < borderW || intXY.x > (borderW + int(uSize) - 1) ||
    intXY.y < borderW || intXY.y > (borderW + int(uSize) - 1)
  ) {
    lowp int w = borderW / 2;
    mediump int end = int(uSize) + 3 * w - 1;
    bool border =
      intXY.x >= w && intXY.x <= end &&
      (intXY.y == w || intXY.y == end) ||
      intXY.y >= w && intXY.y <= end &&
      (intXY.x == w || intXY.x == end);
    oRGBA = rgbaToVec4(border ? ${paletteBlack}u : ${paletteConsole}u);
    return;
  }

  lowp uint color = texelFetch(uMap, ivec2((vXY - uBorderW) * ${mapSize}. / uSize), 0).r;
  oRGBA = rgbaToVec4(uRGBAByColor[color]);
}`

import {paletteBlack, paletteConsole} from '../../shared/theme.js'
import {mapSize} from '../ui.ts'
