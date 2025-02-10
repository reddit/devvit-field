import type {Bitfield} from '../../shared/bitfield.js'
import type {Atlas} from '../graphics/atlas.js'
import type {AttribBuffer} from './attrib-buffer.js'
import type {Cam} from './cam.js'
import {fieldFragGLSL} from './field-frag.glsl.js'
import {fieldVertGLSL} from './field-vert.glsl.js'
import {type GL, Shader} from './shader.js'
import {spriteFragGLSL} from './sprite-frag.glsl.js'
import {spriteVertGLSL} from './sprite-vert.glsl.js'

const uv: Readonly<Int8Array> = new Int8Array([1, 1, 0, 1, 1, 0, 0, 0])

export class Renderer {
  #atlasImage: HTMLImageElement | undefined
  readonly #canvas: HTMLCanvasElement
  #cels: Readonly<Uint16Array> = new Uint16Array()
  #clearRGBA: number = 0x000000ff
  #field: Bitfield | undefined
  #fieldShader: Shader | undefined
  #gl?: GL
  #loseContext: WEBGL_lose_context | null = null
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
      antialias: false,
      // desynchonized: true, breaks framerate
      // powerPreference: 'high-performance',
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
    this.#spriteShader = this.#atlasImage
      ? SpriteShader(gl, this.#atlasImage, this.#cels)
      : undefined
    this.#fieldShader = this.#field ? FieldShader(gl, this.#field) : undefined
  }

  get loseContext(): WEBGL_lose_context | null {
    return this.#loseContext
  }

  hasContext(): boolean {
    return this.#gl != null && !this.#gl.isContextLost()
  }

  load(
    atlas: Atlas<unknown>,
    atlasImage: HTMLImageElement,
    field: Bitfield | undefined,
  ): void {
    this.#atlasImage = atlasImage
    this.#cels = new Uint16Array(atlas.cels)
    this.#field = field
    this.initGL()
  }

  render(
    cam: Readonly<Cam>,
    frame: number,
    bmps: Readonly<AttribBuffer>,
  ): void {
    if (!this.#gl) return
    this.#resize(cam)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)

    if (this.#field && this.#fieldShader) {
      this.#gl.useProgram(this.#fieldShader.pgm)
      this.#gl.bindVertexArray(this.#fieldShader.vao)

      this.#gl.uniform1f(this.#fieldShader.uniforms.uScale!, 12)
      this.#gl.uniform4f(
        this.#fieldShader.uniforms.uCam!,
        cam.x,
        cam.y,
        cam.w,
        cam.h,
      )
      this.#gl.uniform1i(this.#fieldShader.uniforms.uTex!, 0)
      this.#gl.uniform1ui(this.#fieldShader.uniforms.uCellW!, this.#field.cellW)

      for (let row = 0; row < this.#field.wh.h; row++)
        for (let col = 0; col < this.#field.wh.w; col++) {
          const partX = col * this.#field.partWH.w
          const partY = row * this.#field.partWH.h

          this.#gl.uniform4ui(
            this.#fieldShader.uniforms.uPartXYWH!,
            partX,
            partY,
            this.#field.partWH.w,
            this.#field.partWH.h,
          )

          this.#gl.activeTexture(this.#gl.TEXTURE0)
          this.#gl.bindTexture(
            this.#gl.TEXTURE_2D,
            this.#fieldShader.tex[row * this.#field.wh.w + col]!,
          )

          this.#gl.drawArrays(
            this.#gl.TRIANGLE_STRIP,
            0,
            uv.length / 2, // d
          )
        }

      this.#gl.bindVertexArray(null)
    }

    if (!this.#atlasImage || !this.#spriteShader) return

    this.#gl.useProgram(this.#spriteShader.pgm)

    for (const [i, tex] of this.#spriteShader.tex.entries()) {
      this.#gl.activeTexture(this.#gl.TEXTURE0 + i)
      this.#gl.bindTexture(this.#gl.TEXTURE_2D, tex)
    }

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

    this.#gl.bindVertexArray(this.#spriteShader.vao)

    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#spriteShader.buf)
    this.#gl.bufferData(
      this.#gl.ARRAY_BUFFER,
      bmps.buffer,
      this.#gl.DYNAMIC_DRAW,
    )
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null)

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

function SpriteShader(
  gl: GL,
  atlasImage: HTMLImageElement,
  cels: Readonly<Uint16Array>,
): Shader {
  const tex = [gl.createTexture(), gl.createTexture()]
  const shader = Shader(gl, spriteVertGLSL, spriteFragGLSL, tex)

  gl.bindVertexArray(shader.vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.buf)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, 12, 0)
  gl.vertexAttribDivisor(1, 1)
  gl.enableVertexAttribArray(2)
  gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_INT, 12, 4)
  gl.vertexAttribDivisor(2, 1)
  gl.enableVertexAttribArray(3)
  gl.vertexAttribIPointer(3, 1, gl.UNSIGNED_INT, 12, 8)
  gl.vertexAttribDivisor(3, 1)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindVertexArray(null)

  gl.bindTexture(gl.TEXTURE_2D, shader.tex[0]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  // to-do: RED_INTEGER.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    atlasImage,
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  gl.bindTexture(gl.TEXTURE_2D, shader.tex[1]!)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16UI,
    1,
    cels.length / 4, // 4 u8s per row
    0,
    gl.RGBA_INTEGER,
    gl.UNSIGNED_SHORT,
    cels,
  )
  gl.bindTexture(gl.TEXTURE_2D, null)

  return shader
}

function FieldShader(gl: GL, field: Bitfield): Shader {
  const textures = []
  for (let i = 0; i < field.wh.h * field.wh.w; i++)
    textures.push(gl.createTexture())

  const shader = Shader(gl, fieldVertGLSL, fieldFragGLSL, textures)

  gl.bindVertexArray(shader.vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.enableVertexAttribArray(0)
  gl.vertexAttribIPointer(0, 2, gl.BYTE, 0, 0)
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW)
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  for (let row = 0; row < field.wh.h; row++) {
    for (let col = 0; col < field.wh.w; col++) {
      const part = field.getPartByColRow(col, row)
      if (!part) throw Error(`no partition at ${col}, ${row}`)
      gl.bindTexture(gl.TEXTURE_2D, textures[row * field.wh.h + col]!)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R8UI,
        Math.ceil((field.partWH.w * field.cellW) / 8),
        Math.ceil((field.partWH.h * field.cellW) / 8),
        0,
        gl.RED_INTEGER,
        gl.UNSIGNED_BYTE,
        part,
      )
    }
  }
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)

  return shader
}
