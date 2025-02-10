export const fieldFragGLSL: string = `#version 300 es
precision highp float;

uniform mediump vec4 uCam;
uniform uvec2 uFieldWH;
uniform highp usampler2D uTex;
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

void main() {
  vec2 screenXY = vUV * uCam.zw;
  vec2 xy = (screenXY / uScale) + uCam.xy;
  if (xy.x < 0. || xy.x >= float(uFieldWH.x) || xy.y < 0. || xy.y >= float(uFieldWH.y))
    discard;

  vec2 fracXY = fract(xy);
  if (uScale > 10. &&
      (fracXY.x < borderW || fracXY.x > 1.0 - borderW ||
       fracXY.y < borderW || fracXY.y > 1.0 - borderW)) {
    oFrag = vec4(.5, .5, .5, 1.0);
    return;
  }

  lowp uint cell = texelFetch(uTex, ivec2(xy), 0).r;
  oFrag = palette[cell];
}
`
