export const mapVertGLSL: string = `#version 300 es
precision highp float;

uniform mediump vec4 uCam;

layout (location=0) in ivec2 iUV;

out vec2 vXY;

void main() {
  vec2 wh = vec2(${mapSize}, ${mapSize});
  vXY = vec2(iUV) * wh;
  vec2 clip = ((2. * vXY / uCam.zw) - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, 0, 1.0);
}`

import {mapSize} from '../../shared/types/app-config.js'
