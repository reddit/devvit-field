export const tileVertGLSL: string = `#version 300 es
// aligned to sprite-vert.
uniform mediump ivec4 uCam;
uniform mediump uvec2 uTexWH;
uniform lowp uint uTileSide;

layout (location=0) in lowp ivec2 iUV;
layout (location=1) in mediump uint iID;

flat out highp ivec4 vTexXYWH;
out highp vec2 vDstWH;

const mediump int maxY = 0x1000;
const lowp int maxZ = 8;
const mediump int maxDepth = maxY * maxZ;
const highp float depth = float(maxDepth - 1) / float(maxDepth);

void main() {
  mediump int tiledW = int(ceil(float(uCam.z) / float(uTileSide)));
  mediump int x = uCam.x - (uCam.x % int(uTileSide)) + (((gl_InstanceID) % tiledW )) * int(uTileSide);
  mediump int y = uCam.y - (uCam.y % int(uTileSide)) + (((gl_InstanceID) / tiledW)) * int(uTileSide);

  lowp uint texX = (iID * uTileSide) % uTexWH.x;
  lowp uint texY = ((iID * uTileSide) / uTexWH.x) * uTileSide;

  highp ivec2 wh = ivec2(iUV) * ivec2(uTileSide, uTileSide);

  highp vec2 end = vec2(x + wh.x, y + wh.y);
  highp vec2 clip =  ((-2. * vec2(uCam.xy)  + 2. * end) / vec2(uCam.zw) - 1.) * vec2(1, -1);
  gl_Position = vec4(clip, depth, 1);
  vTexXYWH = ivec4(texX, texY, uTileSide, uTileSide);
  vDstWH = vec2(wh);
}`
