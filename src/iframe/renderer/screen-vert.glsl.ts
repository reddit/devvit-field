export const screenVertGLSL: string = `#version 300 es
precision highp float;

layout (location=0) in lowp ivec2 iUV;

out highp vec2 vXY;

void main() {
  vXY = vec2(iUV);
  gl_Position = vec4((2. * vXY) - 1., .5, 1);
}`
