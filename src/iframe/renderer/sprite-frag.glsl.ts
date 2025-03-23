export const spriteFragGLSL: string = `#version 300 es
precision highp float;

uniform mediump sampler2D uTex;
uniform mediump uvec2 uTexWH;

flat in highp ivec4 vTexXYWH;
in highp vec2 vDstWH;
flat in highp ivec2 vDstWHFixed;
flat in lowp uint vStretch;

out highp vec4 oRGBA;

void main() {
  highp vec2 srcWH = vec2(vTexXYWH.zw);
  highp vec2 px = vec2(vTexXYWH.xy) + (vStretch == 1u ? (vDstWH * srcWH / vec2(vDstWHFixed)) : mod(vDstWH, srcWH));
  oRGBA = texture(uTex, px / vec2(uTexWH));
  if(oRGBA.a < .001) discard;
}`
