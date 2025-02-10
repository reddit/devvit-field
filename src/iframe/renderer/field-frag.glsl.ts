export const fieldFragGLSL: string = `#version 300 es
precision highp float;

uniform mediump vec4 uCam;
uniform highp usampler2D uTex;
uniform uvec4 uPartXYWH;
uniform lowp uint uCellW;
uniform float uScale;

in vec2 vUV;

out highp vec4 oFrag;

const vec4 palette[] = vec4[](
  vec4(0, 0, 0, 1),
  vec4(0, 0, 1, 1),
  vec4(0, 1, 0, 1),
  vec4(0, 1, 1, 1),
  vec4(1, 0, 0, 1),
  vec4(1, 0, 1, 1),
  vec4(1, 1, 0, 1),
  vec4(1, 1, 1, 1)
);
float borderW = 0.05;


uint getCell(uvec2 xy) {
  mediump uint i = xy.y * uPartXYWH.z + xy.x;


  lowp uint bit = i * uCellW;
  lowp uint byte = bit >> 3;

  uint w = uint(ceil(float(uPartXYWH.z) * float(uCellW) / 8.));
  lowp uint hi = texelFetch(
    uTex, ivec2(byte % w, byte / w), 0
  ).r;
  lowp uint lo = texelFetch(
    uTex, ivec2((byte + 1u) % w, (byte + 1u) / w), 0
  ).r;
  uint window = (hi << 8u) | lo;

  uint shift = 16u - (bit & 7u) - uCellW;
  uint mask = (1u << uCellW) - 1u;
  return (window >> shift) & mask;
}

void main() {
  vec2 screenXY = vUV * uCam.zw;
  vec2 worldXY = (screenXY / uScale) + uCam.xy;
  vec2 xy = vec2(worldXY.x - float(uPartXYWH.x), worldXY.y - float(uPartXYWH.y));
  if (xy.x < 0. || xy.x >= float(uPartXYWH.z) || xy.y < 0. || xy.y >= float(uPartXYWH.w))
    discard;

  vec2 fracXY = fract(xy);
  if (fracXY.x < borderW || fracXY.x > 1.0 - borderW ||
      fracXY.y < borderW || fracXY.y > 1.0 - borderW) {
    oFrag = vec4(.5, .5, .5, 1.0);
    return;
  }

  lowp uint cell = getCell(uvec2(xy));
  oFrag = palette[cell];
}
`
