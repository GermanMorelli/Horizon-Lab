/** Utilidades minimas de WebGL2: programas, texturas y framebuffers. */

export interface GLCaps {
  /** Se puede renderizar a texturas de coma flotante (RGBA16F / RGBA32F). */
  colorBufferFloat: boolean
  /** Filtrado lineal en texturas float de 32 bits. */
  floatLinear: boolean
  maxTextureSize: number
  renderer: string
}

export function detectCaps(gl: WebGL2RenderingContext): GLCaps {
  const colorBufferFloat = !!gl.getExtension('EXT_color_buffer_float')
  const floatLinear = !!gl.getExtension('OES_texture_float_linear')
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = dbg
    ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
    : 'desconocido'
  return {
    colorBufferFloat,
    floatLinear,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    renderer,
  }
}

function compile(gl: WebGL2RenderingContext, type: number, src: string, label: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? ''
    gl.deleteShader(sh)
    throw new Error(`Error compilando ${label}:\n${log}\n${numberLines(src, log)}`)
  }
  return sh
}

/** Anota las lineas citadas por el log del compilador para localizar el error. */
function numberLines(src: string, log: string): string {
  const bad = new Set<number>()
  for (const m of log.matchAll(/:(\d+):/g)) bad.add(Number(m[1]))
  if (bad.size === 0) return ''
  const lines = src.split('\n')
  const out: string[] = []
  for (const n of [...bad].sort((a, b) => a - b)) {
    for (let i = Math.max(1, n - 2); i <= Math.min(lines.length, n + 2); i++) {
      out.push(`${i === n ? '>' : ' '} ${String(i).padStart(4)} | ${lines[i - 1]}`)
    }
    out.push('')
  }
  return out.join('\n')
}

export class Program {
  readonly handle: WebGLProgram
  private locs = new Map<string, WebGLUniformLocation | null>()

  constructor(
    private gl: WebGL2RenderingContext,
    vertSrc: string,
    fragSrc: string,
    readonly label: string,
  ) {
    const vs = compile(gl, gl.VERTEX_SHADER, vertSrc, `${label} (vertex)`)
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc, `${label} (fragment)`)
    const p = gl.createProgram()!
    gl.attachShader(p, vs)
    gl.attachShader(p, fs)
    gl.linkProgram(p)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p)
      gl.deleteProgram(p)
      throw new Error(`Error enlazando ${label}: ${log}`)
    }
    this.handle = p
  }

  use(): void {
    this.gl.useProgram(this.handle)
  }

  private loc(name: string): WebGLUniformLocation | null {
    let l = this.locs.get(name)
    if (l === undefined) {
      l = this.gl.getUniformLocation(this.handle, name)
      this.locs.set(name, l)
    }
    return l
  }

  f(name: string, v: number): void {
    const l = this.loc(name)
    if (l) this.gl.uniform1f(l, v)
  }
  i(name: string, v: number): void {
    const l = this.loc(name)
    if (l) this.gl.uniform1i(l, v)
  }
  b(name: string, v: boolean): void {
    const l = this.loc(name)
    if (l) this.gl.uniform1i(l, v ? 1 : 0)
  }
  v2(name: string, x: number, y: number): void {
    const l = this.loc(name)
    if (l) this.gl.uniform2f(l, x, y)
  }
  v3(name: string, x: number, y: number, z: number): void {
    const l = this.loc(name)
    if (l) this.gl.uniform3f(l, x, y, z)
  }
  /** Enlaza una textura a una unidad y fija el sampler uniforme. */
  tex(name: string, unit: number, target: number, tex: WebGLTexture | null): void {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(target, tex)
    this.i(name, unit)
  }

  dispose(): void {
    this.gl.deleteProgram(this.handle)
  }
}

export interface RenderTarget {
  fbo: WebGLFramebuffer
  tex: WebGLTexture
  width: number
  height: number
}

export function createRenderTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  internalFormat: number,
  type: number,
  filter: number = gl.LINEAR,
): RenderTarget {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, type, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer incompleto (0x${status.toString(16)})`)
  }
  return { fbo, tex, width, height }
}

export function disposeTarget(gl: WebGL2RenderingContext, t: RenderTarget | null): void {
  if (!t) return
  gl.deleteFramebuffer(t.fbo)
  gl.deleteTexture(t.tex)
}

/**
 * Textura 1D (Nx1) de datos float. Se usa RGBA16F porque en WebGL2 el filtrado
 * lineal esta garantizado para half-float sin extensiones, mientras que para
 * RGBA32F requiere OES_texture_float_linear.
 */
export function createLUT(
  gl: WebGL2RenderingContext,
  data: Float32Array,
  size: number,
): WebGLTexture {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, size, 1, 0, gl.RGBA, gl.FLOAT, data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

/**
 * Cubemap negro de 1x1 por cara.
 *
 * Existe por una restriccion de GLES que no es evidente: un `sampler2D` y un
 * `samplerCube` no pueden apuntar a la misma unidad de textura, ni siquiera si
 * la rama que usa el cubemap nunca se ejecuta. Un samplerCube declarado y sin
 * enlazar se queda en la unidad 0 y colisiona con el primer sampler2D, y GL
 * rechaza el `drawArrays` COMPLETO con GL_INVALID_OPERATION: el resultado es un
 * canvas en negro sin ningun error de compilacion.
 *
 * Asi que el cubemap del fondo estelar se enlaza siempre a su propia unidad,
 * con este relleno cuando no hay panorama cargado.
 */
export function createDummyCubemap(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex)
  const black = new Uint8Array([0, 0, 0, 255])
  const faces = [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
  ]
  for (const f of faces) {
    gl.texImage2D(f, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, black)
  }
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

/** Base radical inversa de Halton: secuencia de baja discrepancia para el jitter. */
export function halton(index: number, base: number): number {
  let f = 1
  let r = 0
  let i = index
  while (i > 0) {
    f /= base
    r += f * (i % base)
    i = Math.floor(i / base)
  }
  return r
}
