export const spriteVertGLSL: string = `#version 300 es
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#essl300_minimum_requirements_webgl_2
uniform mediump vec4 uCam;
uniform lowp usampler2D uCels;
uniform highp uint uFrame;

layout (location=0) in lowp ivec2 iUV;
layout (location=1) in highp uint iX;
layout (location=2) in highp uint iY;
layout (location=3) in highp uint iWH;
layout (location=4) in highp uint iISFFZZ;

flat out highp ivec4 vTexXYWH;
out highp vec2 vDstWH;
flat out highp ivec2 vDstWHFixed;
flat out uint vStretch;

const mediump int maxY = 0x1000;
const lowp int maxZ = 8;
const mediump int maxDepth = maxY * maxZ;

void main() {
  highp int x = int(iX) >> 3;
  highp int y = int(iY << 0) >> 3;
  lowp int z = int(iISFFZZ & 0x7u);
  bool zend = bool(iISFFZZ & 0x8u);
  bool flipX = bool(iISFFZZ & 0x20u);
  bool flipY = bool(iISFFZZ & 0x10u);
  bool stretch = bool(iISFFZZ & 0x40u);
  mediump int id = int((iISFFZZ >> 7) & 0x7ff0u);
  lowp int cel = int((iISFFZZ >> 7) & 0xfu);
  mediump int w = int((iWH >> 12) & 0xfffu);
  mediump int h = int(iWH & 0xfffu);

  lowp int frame = (int(uFrame) / 4 - cel) & 0xf;
  mediump uvec4 texXYWH = texelFetch(uCels, ivec2(0, id + frame), 0);

  // https://www.patternsgameprog.com/opengl-2d-facade-25-get-the-z-of-a-pixel
  highp float depth = float((z + 1) * maxY - (y + (zend ? 0 : h))) / float(maxDepth);

  highp ivec2 targetWH = ivec2(iUV) * ivec2(w, h);

  highp vec2 end = vec2(x + targetWH.x, y + targetWH.y);
  // Cursor and UI layers are always given in screen coordinates.
  vec2 camXY = z >= 3 ? uCam.xy : vec2(0, 0);
  highp vec2 clip =  ((-2. * camXY  + 2. * end) / uCam.zw - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, depth, 1);
  vTexXYWH = ivec4(texXYWH);
  vDstWHFixed = ivec2(w, h) * ivec2(flipX ? -1 : 1, flipY ? -1 : 1);
  vDstWH = vec2(targetWH * ivec2(flipX ? -1 : 1, flipY ? -1 : 1));
  vStretch = stretch ? 1u : 0u;
}`
