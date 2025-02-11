export type GLUniforms = {
  readonly [name: string]: WebGLUniformLocation
}
export type GL = WebGL2RenderingContext
export type GLProgram = WebGLProgram
export type GLTexture = WebGLTexture

export type Shader = {
  readonly pgm: GLProgram | null
  readonly buf: WebGLBuffer | null
  readonly uniforms: GLUniforms
  readonly vao: WebGLVertexArrayObject | null
  readonly textures: readonly GLTexture[]
}

export function Shader(
  gl: GL,
  vertGLSL: string,
  fragGLSL: string,
  textures: readonly GLTexture[],
): Shader {
  const pgm = loadProgram(gl, vertGLSL, fragGLSL)
  gl.useProgram(pgm)
  const uniforms = getUniformLocations(gl, pgm)
  return {
    buf: gl.createBuffer(),
    pgm,
    textures,
    uniforms,
    vao: gl.createVertexArray(),
  }
}

function getUniformLocations(gl: GL, pgm: GLProgram | null): GLUniforms {
  if (!pgm) return {}
  const len = gl.getProgramParameter(pgm, gl.ACTIVE_UNIFORMS)
  const locations: {[name: string]: WebGLUniformLocation} = {}
  for (let i = 0; i < len; ++i) {
    const uniform = gl.getActiveUniform(pgm, i)
    if (uniform == null) throw Error(`no shader uniform at index ${i}`)
    const location = gl.getUniformLocation(pgm, uniform.name)
    if (!location) throw Error(`no shader uniform named "${uniform.name}"`)
    locations[uniform.name] = location
  }
  return locations
}

function loadProgram(
  gl: GL,
  vertGLSL: string,
  fragGLSL: string,
): GLProgram | null {
  const pgm = gl.createProgram()
  if (!pgm) return null

  const vert = compileShader(gl, gl.VERTEX_SHADER, vertGLSL)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragGLSL)
  gl.attachShader(pgm, vert)
  gl.attachShader(pgm, frag)
  gl.linkProgram(pgm)

  const log = gl.getProgramInfoLog(pgm)?.slice(0, -1)
  if (log) console.error(log)

  gl.detachShader(pgm, frag)
  gl.detachShader(pgm, vert)
  gl.deleteShader(frag)
  gl.deleteShader(vert)

  return pgm
}

function compileShader(gl: GL, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw Error('shader creation failed')
  gl.shaderSource(shader, src.trim())
  gl.compileShader(shader)

  const log = gl.getShaderInfoLog(shader)?.slice(0, -1)
  if (log) console.error(log)

  return shader
}
