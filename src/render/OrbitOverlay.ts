/**
 * Overlay de orbitas de particulas de prueba.
 *
 * ---------------------------------------------------------------------------
 * LIMITACION DECLARADA
 * ---------------------------------------------------------------------------
 * Estas lineas NO son una imagen fisica. La imagen de fondo se obtiene siguiendo
 * geodesicas nulas: cada pixel es luz realmente trazada. Estas polilineas, en
 * cambio, se proyectan suponiendo que la luz viaja en LINEA RECTA desde cada
 * punto de la orbita hasta la camara, en un espacio pseudo-cartesiano construido
 * a partir de (r, theta, phi).
 *
 * Es por tanto un DIAGRAMA en el espacio de coordenadas superpuesto a una
 * observacion, y las dos cosas no son consistentes entre si: una orbita que pase
 * por detras del agujero deberia verse deformada por el lente, y aqui aparece
 * recta. Hacerlo correctamente exigiria trazar geodesicas nulas desde cada punto
 * de la orbita hasta la camara, que esta fuera del alcance del proyecto.
 *
 * La UI lo etiqueta como "vista esquematica" por esta razon. Lo que si se hace
 * bien es la ocultacion: un punto cuya linea de vision recta atraviesa el
 * horizonte se atenua, para que la orbita no parezca flotar por delante de la
 * sombra.
 */

import { toCartesian, type OrbitResult } from '../physics/orbits'
import { horizons, type BHParams } from '../physics/kerrNewman'
import { Program } from './gl'

import overlayVert from './shaders/overlay.vert'
import overlayFrag from './shaders/overlay.frag'

export interface OrbitTrace {
  id: number
  label: string
  color: [number, number, number]
  /** Puntos en pseudo-cartesianas. */
  points: Array<[number, number, number]>
  /** Metadatos para el panel. */
  info: {
    outcome: OrbitResult['outcome']
    rMin: number
    rMax: number
    charged: boolean
    eps: number
    orbits: number
  }
}

export interface OverlayCamera {
  /** Posicion de la camara en Boyer-Lindquist. */
  r: number
  theta: number
  phi: number
  tanHalfFov: number
  aspect: number
}

export class OrbitOverlay {
  private prog: Program
  private vao: WebGLVertexArrayObject
  private vbo: WebGLBuffer
  private traces: OrbitTrace[] = []
  private nextId = 1
  /** Buffer de trabajo: (x, y, fade) por vertice. */
  private scratch = new Float32Array(0)

  constructor(private gl: WebGL2RenderingContext) {
    this.prog = new Program(gl, overlayVert, overlayFrag, 'overlay de orbitas')
    this.vao = gl.createVertexArray()!
    this.vbo = gl.createBuffer()!

    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 12, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 12, 8)
    gl.bindVertexArray(null)
  }

  get list(): readonly OrbitTrace[] {
    return this.traces
  }

  add(trace: Omit<OrbitTrace, 'id'>): OrbitTrace {
    const t = { ...trace, id: this.nextId++ }
    this.traces.push(t)
    return t
  }

  clear(): void {
    this.traces = []
  }

  remove(id: number): void {
    this.traces = this.traces.filter((t) => t.id !== id)
  }

  get isEmpty(): boolean {
    return this.traces.length === 0
  }

  /**
   * Dibuja las orbitas sobre el framebuffer actual.
   * Debe llamarse DESPUES del composite, ya que compone en espacio de pantalla.
   */
  draw(cam: OverlayCamera, bh: BHParams, opacity: number): void {
    if (this.traces.length === 0 || opacity <= 0) return
    const gl = this.gl

    const st = Math.sin(cam.theta)
    const ct = Math.cos(cam.theta)
    const sp = Math.sin(cam.phi)
    const cp = Math.cos(cam.phi)

    // Posicion de la camara y base esferica local, en pseudo-cartesianas.
    const C: [number, number, number] = [cam.r * st * cp, cam.r * st * sp, cam.r * ct]
    const rHat: [number, number, number] = [st * cp, st * sp, ct]
    const thHat: [number, number, number] = [ct * cp, ct * sp, -st]
    const phHat: [number, number, number] = [-sp, cp, 0]

    const h = horizons(bh)
    const rBlock = h.hasHorizon ? h.rPlus : 0

    gl.bindVertexArray(this.vao)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    this.prog.use()
    this.prog.f('u_opacity', opacity)

    for (const trace of this.traces) {
      const n = trace.points.length
      if (n < 2) continue
      if (this.scratch.length < n * 3) this.scratch = new Float32Array(n * 3)
      const buf = this.scratch

      let written = 0
      for (let i = 0; i < n; i++) {
        const P = trace.points[i]
        const dx = P[0] - C[0]
        const dy = P[1] - C[1]
        const dz = P[2] - C[2]

        // Componentes en la base local: la misma ordenacion (d_r, d_th, d_ph) que
        // usa kerr.frag para construir el rayo de cada pixel.
        const aR = dx * rHat[0] + dy * rHat[1] + dz * rHat[2]
        const aT = dx * thHat[0] + dy * thHat[1] + dz * thHat[2]
        const aP = dx * phHat[0] + dy * phHat[1] + dz * phHat[2]

        // El punto esta delante de la camara si su componente radial es entrante.
        const s = -aR
        if (s <= 1e-6) {
          // Detras de la camara: se marca invisible manteniendo la continuidad
          // de la tira de lineas.
          buf[written * 3] = 0
          buf[written * 3 + 1] = 0
          buf[written * 3 + 2] = 0
          written++
          continue
        }

        const ndcX = aP / (s * cam.tanHalfFov * cam.aspect)
        const ndcY = -aT / (s * cam.tanHalfFov)

        // Ocultacion: si la linea de vision recta pasa por el horizonte y el
        // agujero queda ENTRE la camara y el punto, el punto no se ve.
        let fade = 1
        if (rBlock > 0) {
          const lx = P[0] - C[0]
          const ly = P[1] - C[1]
          const lz = P[2] - C[2]
          const len2 = lx * lx + ly * ly + lz * lz
          if (len2 > 1e-12) {
            const u = -(C[0] * lx + C[1] * ly + C[2] * lz) / len2
            if (u > 0 && u < 1) {
              const qx = C[0] + u * lx
              const qy = C[1] + u * ly
              const qz = C[2] + u * lz
              const dist = Math.sqrt(qx * qx + qy * qy + qz * qz)
              // Transicion suave en el borde de la sombra en vez de un corte seco.
              fade = Math.min(1, Math.max(0, (dist - rBlock) / (0.6 * rBlock)))
            }
          }
        }

        buf[written * 3] = ndcX
        buf[written * 3 + 1] = ndcY
        buf[written * 3 + 2] = fade
        written++
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
      gl.bufferData(gl.ARRAY_BUFFER, buf.subarray(0, written * 3), gl.DYNAMIC_DRAW)
      this.prog.v3('u_color', trace.color[0], trace.color[1], trace.color[2])
      gl.drawArrays(gl.LINE_STRIP, 0, written)
    }

    gl.disable(gl.BLEND)
    gl.bindVertexArray(null)
  }

  dispose(): void {
    this.gl.deleteBuffer(this.vbo)
    this.gl.deleteVertexArray(this.vao)
    this.prog.dispose()
  }
}

/** Convierte el resultado de un trazado en puntos dibujables, submuestreando. */
export function traceToPoints(res: OrbitResult, maxPoints = 4000): Array<[number, number, number]> {
  const src = res.path
  if (src.length <= maxPoints) return src.map(toCartesian)
  const stride = Math.ceil(src.length / maxPoints)
  const out: Array<[number, number, number]> = []
  for (let i = 0; i < src.length; i += stride) out.push(toCartesian(src[i]))
  // Conservar el punto final para que la orbita no quede truncada.
  out.push(toCartesian(src[src.length - 1]))
  return out
}
