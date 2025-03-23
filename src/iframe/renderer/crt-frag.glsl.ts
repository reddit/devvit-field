export const crtFragGLSL: string = `#version 300 es
precision highp float;

uniform highp vec4 uCam;
uniform highp sampler2D uScene;
uniform highp uint uFrame;

in highp vec2 vXY;

out highp vec4 oRGBA;

const float pi = 3.14159265359;

void main() {
  vec2 center = vec2(.5, .5);
  vec2 uv = vXY - center;

  float len = length(uv);
  float radialLen = len * (1. + .005 * len * len);
  vec2 dir = (len > 0.) ? uv / len : uv; // Unit vector.

  float glow = .9 + cos(pi / 2. - pi * float(uFrame % 360u) / 360.) / 4.;

  float shift = .0012;
  float rShift = -shift;
  float gShift = 0.;
  float bShift = shift;

  vec2 uvR = center + dir * (radialLen + rShift * len);
  vec2 uvG = center + dir * (radialLen + gShift * len);
  vec2 uvB = center + dir * (radialLen + bShift * len);

  float r = (uvR.x < 0. || uvR.x > 1. || uvR.y < 0. || uvR.y > 1.) ? 0. : texture(uScene, uvR).r;
  float g = (uvG.x < 0. || uvG.x > 1. || uvG.y < 0. || uvG.y > 1.) ? 0. : texture(uScene, uvG).g;
  float b = (uvB.x < 0. || uvB.x > 1. || uvB.y < 0. || uvB.y > 1.) ? 0. : texture(uScene, uvB).b;
  vec3 curve = vec3(r, g, b);

  const float samples = 16.;
  vec3 blur = vec3(0);
  for (float i = 0.; i < samples; i++) {
    float dist = -samples / 2. + i;
    vec2 offset = vXY + (dist / uCam.zw) * vec2(-1, -1);
    float weight = dist == 0. ? .03 : abs(.05 / dist);
    blur += texture(uScene, offset).rgb * weight;
  }

  float scanlines = uCam.w / 3.;
  float scanY = vXY.y * scanlines;
  float odd = mod(floor(scanY), 2.);
  float scan = mix(1.0, .7, odd);

  oRGBA = vec4(curve * glow * scan + blur, 1);
}`
