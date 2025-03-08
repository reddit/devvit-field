export const mapFragGLSL: string = `#version 300 es
precision highp float;

uniform highp usampler2D uMap;
uniform highp float uSize;
uniform highp uint uRGBAByColor[6];
uniform highp ivec4 uViewfinder;

in vec2 vXY;

out highp vec4 oFrag;

vec4 rgbaToVec4(highp uint rgba) {
  float r = float((rgba >> 24u) & 0xffu);
  float g = float((rgba >> 16u) & 0xffu);
  float b = float((rgba >>  8u) & 0xffu);
  float a = float( rgba         & 0xffu);
  return vec4(r / 255., g / 255., b / 255., a / 255.);
}

void main() {
  mediump ivec2 intXY = ivec2(vXY);
  if (
    intXY.x == 0 || intXY.x == (int(uSize) - 1) ||
    intXY.y == 0 || intXY.y == (int(uSize) - 1) ||
    intXY.x >= uViewfinder.x && intXY.x <= (uViewfinder.x + uViewfinder.z) &&
    (intXY.y == uViewfinder.y || intXY.y == (uViewfinder.y + uViewfinder.w)) ||
    intXY.y >= uViewfinder.y && intXY.y <= (uViewfinder.y + uViewfinder.w) &&
    (intXY.x == uViewfinder.x || intXY.x == (uViewfinder.x + uViewfinder.z))
  ) {
    oFrag = rgbaToVec4(uRGBAByColor[2]);
    return;
  }

  lowp uint color = texelFetch(uMap, ivec2(vXY * ${mapSize}. / uSize), 0).r;
  oFrag = rgbaToVec4(uRGBAByColor[color]);
}`

import {mapSize} from '../../shared/types/app-config.js'
