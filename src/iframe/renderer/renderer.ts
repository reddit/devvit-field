import type {XY} from '../../shared/types/2d.js'
import {mapSize} from '../../shared/types/app-config.js'
import type {FieldConfig} from '../../shared/types/field-config.js'
import {type Level, levelWord} from '../../shared/types/level.js'
import type {Tag} from '../game/config.js'
import type {Atlas} from '../graphics/atlas.js'
import type {AttribBuffer} from './attrib-buffer.js'
import type {Cam} from './cam.js'
import {fieldFragGLSL} from './field-frag.glsl.js'
import {fieldVertGLSL} from './field-vert.glsl.js'
import {mapFragGLSL} from './map-frag.glsl.js'
import {mapVertGLSL} from './map-vert.glsl.js'
import {type GL, Shader} from './shader.js'
import {spriteFragGLSL} from './sprite-frag.glsl.js'
import {spriteVertGLSL} from './sprite-vert.glsl.js'

const uv: Readonly<Int8Array> = new Int8Array([1, 1, 0, 1, 1, 0, 0, 0])

export class Renderer {
  #atlasImage: HTMLImageElement | undefined
  readonly #canvas: HTMLCanvasElement
  #cels: Readonly<Uint16Array> = new Uint16Array()
  #clearRGBA: number = 0x000000ff
  #field: Readonly<Uint8Array> | undefined
  #fieldConfig: Readonly<FieldConfig> | undefined
  #fieldShader: Shader | undefined
  #gl?: GL
  #idByColor: Uint32Array = new Uint32Array()
  #loseContext: WEBGL_lose_context | null = null
  #map: Readonly<Uint8Array> | undefined
  #mapShader: Shader | undefined
  #spriteShader: Shader | undefined

  constructor(canvas: HTMLCanvasElement) {
    this.#canvas = canvas
  }

  clearColor(rgba: number): void {
    this.#clearRGBA = rgba
    this.#gl?.clearColor(
      ((rgba >>> 24) & 0xff) / 0xff,
      ((rgba >>> 16) & 0xff) / 0xff,
      ((rgba >>> 8) & 0xff) / 0xff,
      ((rgba >>> 0) & 0xff) / 0xff,
    )
  }

  initGL(): void {
    const gl = this.#canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      ...(devMode && {powerPreference: 'low-power'}),
    })
    if (!gl) throw Error('WebGL v2 unsupported')
    this.#gl = gl

    this.clearColor(this.#clearRGBA)

    // Allow transparent textures to be layered.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Enable z-buffer for [0, 1] ([foreground, background]).
    gl.enable(gl.DEPTH_TEST)
    gl.depthRange(0, 1)
    gl.clearDepth(1)
    gl.depthFunc(gl.LESS)

    // Disable image colorspace conversions. the default is browser dependent.
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false)

    this.#loseContext = gl.getExtension('WEBGL_lose_context')
    this.#fieldShader =
      this.#atlasImage && this.#field && this.#fieldConfig
        ? FieldShader(
            gl,
            this.#atlasImage,
            this.#cels,
            this.#field,
            this.#fieldConfig,
          )
        : undefined
    this.#mapShader = this.#map ? MapShader(gl, this.#map) : undefined
    this.#spriteShader = this.#atlasImage
      ? SpriteShader(gl, this.#atlasImage, this.#cels)
      : undefined
  }

  get loseContext(): WEBGL_lose_context | null {
    return this.#loseContext
  }

  hasContext(): boolean {
    return this.#gl != null && !this.#gl.isContextLost()
  }

  load(
    atlas: Atlas<Tag>,
    atlasImage: HTMLImageElement,
    field: Readonly<Uint8Array> | undefined,
    fieldConfig: Readonly<FieldConfig> | undefined,
    map: Readonly<Uint8Array> | undefined,
    lvl: Level | undefined,
  ): void {
    this.#atlasImage = atlasImage
    this.#cels = new Uint16Array(atlas.cels)
    this.#field = field
    this.#fieldConfig = fieldConfig
    this.#map = map
    if (lvl != null) {
      const pascalLvl = levelWord[lvl]
      this.#idByColor = new Uint32Array([
        0, // Hidden, unused.
        atlas.anim[`box--Ban${pascalLvl}`].id,
        atlas.anim['box--Flamingo'].id,
        atlas.anim['box--JuiceBox'].id,
        atlas.anim['box--Lasagna'].id,
        atlas.anim['box--Sunshine'].id,
        0, // Pending, unused.
      ])
    }
    this.initGL()
  }

  render(
    cam: Readonly<Cam>,
    frame: number,
    bmps: Readonly<AttribBuffer>,
    fieldScale: number,
  ): void {
    if (!this.#gl) return
    this.#resize(cam)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)

    this.#renderField(cam, frame, fieldScale)
    this.#renderSprites(cam, frame, bmps)
    this.#renderMap(cam)
  }

  setBox(xy: Readonly<XY>, val: number): void {
    if (!this.#fieldShader || !this.#gl) return
    this.#gl.bindTexture(this.#gl.TEXTURE_2D, this.#fieldShader.textures[2]!)
    this.#gl.texSubImage2D(
      this.#gl.TEXTURE_2D,
      0,
      xy.x,
      xy.y,
      1,
      1,
      this.#gl.RED_INTEGER,
      this.#gl.UNSIGNED_BYTE,
      new Uint8Array([val]),
    )
    this.#gl.bindTexture(this.#gl.TEXTURE_2D, null)
  }

  #renderField(cam: Readonly<Cam>, frame: number, fieldScale: number): void {
    if (
      !this.#atlasImage ||
      !this.#gl ||
      !this.#field ||
      !this.#fieldConfig ||
      !this.#fieldShader
    )
      return

    this.#gl.useProgram(this.#fieldShader.pgm)

    this.#gl.uniform1i(this.#fieldShader.uniforms.uTex!, 0)
    this.#gl.uniform1i(this.#fieldShader.uniforms.uCels!, 1)
    this.#gl.uniform1i(this.#fieldShader.uniforms.uField!, 2)
    this.#gl.uniform2ui(
      this.#fieldShader.uniforms.uTexWH!,
      this.#atlasImage.naturalWidth,
      this.#atlasImage.naturalHeight,
    )
    this.#gl.uniform4f(
      this.#fieldShader.uniforms.uCam!,
      cam.x,
      cam.y,
      cam.w,
      cam.h,
    )
    this.#gl.uniform1ui(this.#fieldShader.uniforms.uFrame!, frame)
    this.#gl.uniform1f(this.#fieldShader.uniforms.uScale!, fieldScale)
    this.#gl.uniform2ui(
      this.#fieldShader.uniforms.uFieldWH!,
      this.#fieldConfig.wh.w,
      this.#fieldConfig.wh.h,
    )
    this.#gl.uniform1uiv(
      this.#fieldShader.uniforms.uIDByColor!,
      this.#idByColor,
    )

    for (const [i, tex] of this.#fieldShader.textures.entries()) {
      this.#gl.activeTexture(this.#gl.TEXTURE0 + i)
      this.#gl.bindTexture(this.#gl.TEXTURE_2D, tex)
    }

    this.#gl.bindVertexArray(this.#fieldShader.vao)
    this.#gl.drawArrays(
      this.#gl.TRIANGLE_STRIP,
      0,
      uv.length / 2, // d
    )
    this.#gl.bindVertexArray(null)
  }

  #renderMap(cam: Readonly<Cam>): void {
    if (!this.#gl || !this.#mapShader) return

    this.#gl.useProgram(this.#mapShader.pgm)

    this.#gl.uniform1i(this.#mapShader.uniforms.uMap!, 0)
    this.#gl.uniform4f(
      this.#mapShader.uniforms.uCam!,
      cam.x,
      cam.y,
      cam.w,
      cam.h,
    )
    this.#gl.uniform1f(
      this.#mapShader.uniforms.uSize!,
      mapSize * devicePixelRatio,
    )

    for (const [i, tex] of this.#mapShader.textures.entries()) {
      this.#gl.activeTexture(this.#gl.TEXTURE0 + i)
      this.#gl.bindTexture(this.#gl.TEXTURE_2D, tex)
    }

    this.#gl.bindVertexArray(this.#mapShader.vao)
    this.#gl.drawArrays(
      this.#gl.TRIANGLE_STRIP,
      0,
      uv.length / 2, // d
    )
    this.#gl.bindVertexArray(null)
  }

  #renderSprites(
    cam: Readonly<Cam>,
    frame: number,
    bmps: Readonly<AttribBuffer>,
  ): void {
    if (!this.#gl || !this.#atlasImage || !this.#spriteShader) return

    this.#gl.useProgram(this.#spriteShader.pgm)

    this.#gl.uniform1i(this.#spriteShader.uniforms.uTex!, 0)
    this.#gl.uniform1i(this.#spriteShader.uniforms.uCels!, 1)
    this.#gl.uniform2ui(
      this.#spriteShader.uniforms.uTexWH!,
      this.#atlasImage.naturalWidth,
      this.#atlasImage.naturalHeight,
    )
    this.#gl.uniform4f(
      this.#spriteShader.uniforms.uCam!,
      cam.x,
      cam.y,
      cam.w,
      cam.h,
    )
    this.#gl.uniform1ui(this.#spriteShader.uniforms.uFrame!, frame)

    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#spriteShader.buf)
    this.#gl.bufferData(
      this.#gl.ARRAY_BUFFER,
      bmps.buffer,
      this.#gl.DYNAMIC_DRAW,
    )
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null)

    for (const [i, tex] of this.#spriteShader.textures.entries()) {
      this.#gl.activeTexture(this.#gl.TEXTURE0 + i)
      this.#gl.bindTexture(this.#gl.TEXTURE_2D, tex)
    }

    this.#gl.bindVertexArray(this.#spriteShader.vao)
    this.#gl.drawArraysInstanced(
      this.#gl.TRIANGLE_STRIP,
      0,
      uv.length / 2, // d
      bmps.size,
    )
    this.#gl.bindVertexArray(null)
  }

  #resize(cam: Readonly<Cam>): void {
    const canvas = this.#canvas

    if (canvas.width !== cam.w || canvas.height !== cam.h) {
      canvas.width = cam.w
      canvas.height = cam.h
      this.#gl!.viewport(0, 0, cam.w, cam.h)
      this.#canvas.focus() // hack: propagate key events.
    }

    // These pixels may be greater than, less than, or equal to cam. ratio
    // may change independent of canvas size.
    // to-do: innerWidth?
    const clientW = (cam.w * cam.scale) / devicePixelRatio
    const clientH = (cam.h * cam.scale) / devicePixelRatio
    const dw = Number.parseFloat(canvas.style.width.slice(0, -2)) - clientW
    const dh = Number.parseFloat(canvas.style.height.slice(0, -2)) - clientH
    if (
      !Number.isFinite(dw) ||
      Math.abs(dw) > 0.1 ||
      !Number.isFinite(dh) ||
      Math.abs(dh) > 0.1
    ) {
      canvas.style.width = `${clientW}px`
      canvas.style.height = `${clientH}px`
    }
  }
}

function FieldShader(
  gl: GL,
  atlasImage: HTMLImageElement,
  cels: Readonly<Uint16Array>,
  field: Uint8Array,
  config: Readonly<FieldConfig>,
): Shader {
  const shader = Shader(gl, fieldVertGLSL, fieldFragGLSL, [
    gl.createTexture(),
    gl.createTexture(),
    gl.createTexture(),
  ]) // to-do: share textures.

  gl.bindVertexArray(shader.vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindTexture(gl.TEXTURE_2D, shader.textures[0]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    atlasImage,
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  gl.bindTexture(gl.TEXTURE_2D, shader.textures[1]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16UI,
    1,
    cels.length / 4, // 4 u16s per row
    0,
    gl.RGBA_INTEGER,
    gl.UNSIGNED_SHORT,
    cels,
  )

  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.bindTexture(gl.TEXTURE_2D, shader.textures[2]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R8UI,
    config.wh.w,
    config.wh.h,
    0,
    gl.RED_INTEGER,
    gl.UNSIGNED_BYTE,
    field,
  )
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)

  return shader
}

function MapShader(gl: GL, map: Uint8Array): Shader {
  const shader = Shader(gl, mapVertGLSL, mapFragGLSL, [gl.createTexture()])

  gl.bindVertexArray(shader.vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.bindTexture(gl.TEXTURE_2D, shader.textures[0]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R8UI,
    mapSize,
    mapSize,
    0,
    gl.RED_INTEGER,
    gl.UNSIGNED_BYTE,
    map,
  )
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)

  return shader
}

function SpriteShader(
  gl: GL,
  atlasImage: HTMLImageElement,
  cels: Readonly<Uint16Array>,
): Shader {
  const shader = Shader(gl, spriteVertGLSL, spriteFragGLSL, [
    gl.createTexture(),
    gl.createTexture(),
  ])

  gl.bindVertexArray(shader.vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.buf)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, 16, 0)
  gl.vertexAttribDivisor(1, 1)
  gl.enableVertexAttribArray(2)
  gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_INT, 16, 4)
  gl.vertexAttribDivisor(2, 1)
  gl.enableVertexAttribArray(3)
  gl.vertexAttribIPointer(3, 1, gl.UNSIGNED_INT, 16, 8)
  gl.vertexAttribDivisor(3, 1)
  gl.enableVertexAttribArray(4)
  gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_INT, 16, 12)
  gl.vertexAttribDivisor(4, 1)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindVertexArray(null)

  gl.bindTexture(gl.TEXTURE_2D, shader.textures[0]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    atlasImage,
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  gl.bindTexture(gl.TEXTURE_2D, shader.textures[1]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16UI,
    1,
    cels.length / 4, // 4 u16s per row
    0,
    gl.RGBA_INTEGER,
    gl.UNSIGNED_SHORT,
    cels,
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  return shader
}
