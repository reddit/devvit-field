export const fieldVertGLSL: string = `#version 300 es
precision highp float;

uniform highp vec4 uCam;
uniform highp float uScale;

layout (location=0) in lowp ivec2 iUV;

out highp vec2 vUV;

void main() {
  vUV = vec2(iUV);
  vec2 clip = ((2. * vec2(iUV) * uScale) - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, .999, 1);
}`
