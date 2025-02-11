export const spriteFragGLSL: string = `#version 300 es
uniform mediump sampler2D uTex;
uniform mediump uvec2 uTexWH;

flat in highp ivec4 vTexXYWH;
in highp vec2 vDstWH;

out highp vec4 oFrag;

void main() {
  highp vec2 px = vec2(vTexXYWH.xy) + mod(vDstWH, vec2(vTexXYWH.zw));
  oFrag = texture(uTex, px / vec2(uTexWH));
  if(oFrag.a < .001) discard;
}`
