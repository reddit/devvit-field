export const mapVertGLSL: string = `#version 300 es
precision highp float;

uniform highp vec4 uCam;
uniform highp float uSize;
uniform highp float uBorderW;

layout (location=0) in lowp ivec2 iUV;

out highp vec2 vXY;

void main() {
  highp vec2 wh = vec2(uSize + uBorderW * 2., uSize + uBorderW * 2.);
  vXY = vec2(iUV) * wh;
  highp vec2 clip = ((2. * vXY / uCam.zw) - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, 0, 1.0);
}`
