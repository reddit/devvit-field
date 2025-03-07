export const mapFragGLSL: string = `#version 300 es
precision highp float;

uniform highp usampler2D uMap;
uniform highp float uSize;

in vec2 vXY;

out highp vec4 oFrag;

const vec4 palette[] = vec4[](
  ${rgbaVec4(paletteBlack)},
  ${rgbaVec4(paletteTerminalGreen)}, // to-do: vary
  ${rgbaVec4(paletteFlamingo)},
  ${rgbaVec4(paletteJuiceBox)},
  ${rgbaVec4(paletteLasagna)},
  ${rgbaVec4(paletteSunshine)}
);

void main() {
  // if (int(vXY.x) % 10 == 0 || int(vXY.y) % 10 == 0) {
  if (
    vXY.x <= 1. || vXY.x >= (uSize - 1.) ||
    vXY.y <= 1. || vXY.y >= (uSize - 1.)
  ) {
    oFrag = palette[1];
    return;
  }

  lowp uint box = texelFetch(uMap, ivec2(vXY), 0).r;
  oFrag = palette[box];
}`

import {
  paletteBlack,
  paletteFlamingo,
  paletteJuiceBox,
  paletteLasagna,
  paletteSunshine,
  paletteTerminalGreen,
} from '../../shared/theme.ts'

function rgbaVec4(rgba: number): string {
  const r = ((rgba >>> 24) & 0xff) / 0xff
  const g = ((rgba >>> 16) & 0xff) / 0xff
  const b = ((rgba >>> 8) & 0xff) / 0xff
  const a = ((rgba >>> 0) & 0xff) / 0xff
  return `vec4(${r}, ${g}, ${b}, ${a})`
}
