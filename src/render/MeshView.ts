/**
 * Vista de la malla del espaciotiempo.
 *
 * ---------------------------------------------------------------------------
 * LO QUE ESTA VISTA ES, Y LO QUE NO
 * ---------------------------------------------------------------------------
 * La superficie que se dibuja es el EMBEDDING ISOMETRICO de la rebanada ecuatorial
 * (el paraboloide de Flamm generalizado a Kerr-Newman), calculado en
 * `physics/embedding.ts`. Isometrico significa que las distancias medidas sobre la
 * superficie son las distancias propias reales de esa rebanada: la forma no es
 * decorativa.
 *
 * Pero conviene ser explicito con el alcance, porque esta es la imagen que mas se
 * malinterpreta de toda la relatividad general:
 *
 *  - Es UNA REBANADA ESPACIAL (t constante, plano ecuatorial), no el espaciotiempo.
 *  - La altura es una dimension AUXILIAR de inmersion. No existe fisicamente y
 *    nada cae "hacia abajo" por ella.
 *  - La curvatura espacial NO es lo que hace caer a los objetos. Para velocidades
 *    bajas, casi toda la gravedad newtoniana sale de la curvatura del TIEMPO. Por
 *    eso la malla se colorea por el LAPSO (el ritmo del tiempo propio), que es la
 *    parte que la cama elastica omite: el color, no la forma, es lo que explica la
 *    caida.
 *
 * La proyeccion se hace en CPU, con perspectiva ordinaria: aqui no hay trazado de
 * luz, es un diagrama, y se dibuja como tal.
 */

import {
  equatorialEmbedding,
  horizonEmbedding,
  staticLapse,
  type EmbeddingResult,
} from '../physics/embedding'
import { horizons, type BHParams } from '../physics/kerrNewman'
import type { SimParams } from '../state/params'
import { Program } from './gl'

import meshVert from './shaders/mesh.vert'
import meshFrag from './shaders/mesh.frag'

export interface MeshCamera {
  /** Distancia de la camara al origen, en unidades de M. */
  distance: number
  /** Inclinacion respecto al eje vertical de la inmersion. */
  inclination: number
  azimuth: number
  tanHalfFov: number
  aspect: number
}

interface Vertex {
  /** Posicion en el espacio de inmersion (x, y = altura auxiliar, z). */
  p: [number, number, number]
  color: [number, number, number]
}

export class MeshView {
  private prog: Program
  private vao: WebGLVertexArrayObject
  private vbo: WebGLBuffer
  private data = new Float32Array(0)

  /** Cache del embedding: recalcularlo en cada frame seria un desperdicio. */
  private cache: {
    key: string
    emb: EmbeddingResult
    lapseAt: (r: number) => number
    rPlus: number
  } | null = null

  constructor(private gl: WebGL2RenderingContext) {
    this.prog = new Program(gl, meshVert, meshFrag, 'malla del espaciotiempo')
    this.vao = gl.createVertexArray()!
    this.vbo = gl.createBuffer()!
    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    const stride = 6 * 4
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 8)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 20)
    gl.bindVertexArray(null)
  }

  /**
   * Color por lapso: del azul profundo (tiempo casi detenido, junto al horizonte)
   * al blanco calido (tiempo normal, lejos). Es el gradiente que produce la caida.
   */
  private lapseColor(alpha: number): [number, number, number] {
    if (!Number.isFinite(alpha)) {
      // Dentro de la ergosfera no existe observador estatico: no hay un ritmo del
      // tiempo que colorear, y se marca en magenta para que se vea que es otra cosa.
      return [0.75, 0.15, 0.6]
    }
    const t = Math.min(Math.max(alpha, 0), 1)
    // Rampa perceptualmente monotona: azul -> cian -> ambar -> blanco.
    const r = Math.pow(t, 1.6)
    const g = 0.25 * t + 0.75 * Math.pow(t, 2.2)
    const b = 0.55 + 0.45 * Math.pow(t, 0.6) - 0.55 * Math.pow(t, 3)
    return [0.25 + 0.75 * r, 0.3 + 0.7 * g, b]
  }

  private ensure(bh: BHParams, p: SimParams) {
    const key = `${bh.a}|${bh.q}|${p.meshOuterRadius}`
    if (this.cache?.key === key) return this.cache
    const emb = equatorialEmbedding(bh, p.meshOuterRadius, 220)
    const rPlus = horizons(bh).rPlus
    this.cache = {
      key,
      emb,
      lapseAt: (r: number) => staticLapse(r, bh),
      rPlus,
    }
    return this.cache
  }

  /**
   * Dibuja la malla. Debe llamarse con el framebuffer por defecto ya limpiado.
   */
  draw(cam: MeshCamera, bh: BHParams, p: SimParams): void {
    const gl = this.gl
    const { emb, lapseAt } = this.ensure(bh, p)
    if (emb.points.length < 2) return

    // --- Camara de perspectiva ordinaria -----------------------------------
    // El eje vertical de la inmersion es +y en el espacio del diagrama.
    const si = Math.sin(cam.inclination)
    const ci = Math.cos(cam.inclination)
    const sa = Math.sin(cam.azimuth)
    const ca = Math.cos(cam.azimuth)
    const C: [number, number, number] = [
      cam.distance * si * ca,
      cam.distance * ci,
      cam.distance * si * sa,
    ]
    const fwd = norm([-C[0], -C[1], -C[2]])
    const right = norm(cross([0, 1, 0], fwd))
    const up = cross(fwd, right)

    /** Proyecta un punto del diagrama a NDC. Devuelve null si queda detras. */
    const project = (q: readonly [number, number, number]) => {
      const d: [number, number, number] = [q[0] - C[0], q[1] - C[1], q[2] - C[2]]
      const z = dot(d, fwd)
      if (z <= 0.05) return null
      const x = dot(d, right)
      const y = dot(d, up)
      return {
        ndc: [x / (z * cam.tanHalfFov * cam.aspect), y / (z * cam.tanHalfFov)] as [number, number],
        // Atenuacion con la distancia, para dar sensacion de profundidad sin
        // depender de un buffer de profundidad.
        fade: Math.min(1, Math.max(0.12, 2.2 / (1 + z / cam.distance))),
      }
    }

    // --- Construccion del alambre ------------------------------------------
    const verts: Array<[number, number, number, number, number, number]> = []
    const push = (v: Vertex, prev: Vertex | null) => {
      if (!prev) return
      const a = project(prev.p)
      const b = project(v.p)
      if (!a || !b) return
      verts.push([a.ndc[0], a.ndc[1], prev.color[0], prev.color[1], prev.color[2], a.fade])
      verts.push([b.ndc[0], b.ndc[1], v.color[0], v.color[1], v.color[2], b.fade])
    }

    const nLon = Math.max(8, Math.round(28 * p.meshGridDensity))
    const hScale = p.meshHeightScale
    // Muestreo radial: se salta puntos si la densidad es baja.
    const radialStep = Math.max(1, Math.round(4 / p.meshGridDensity))

    /** Vertice de la superficie en (indice radial, longitud). */
    const vertexAt = (i: number, lon: number): Vertex => {
      const pt = emb.points[i]
      const th = (2 * Math.PI * lon) / nLon
      const color = p.meshShowLapse
        ? this.lapseColor(lapseAt(pt.r))
        : ([0.55, 0.68, 0.95] as [number, number, number])
      return {
        p: [pt.R * Math.cos(th), pt.z * hScale, pt.R * Math.sin(th)],
        color,
      }
    }

    if (p.meshShowSurface) {
      // Meridianos: lineas de longitud constante, que muestran el perfil del embudo.
      for (let lon = 0; lon < nLon; lon++) {
        let prev: Vertex | null = null
        for (let i = 0; i < emb.points.length; i += radialStep) {
          const v = vertexAt(i, lon)
          push(v, prev)
          prev = v
        }
      }
      // Paralelos: circunferencias de radio circunferencial constante.
      const ringStep = Math.max(4, Math.round(14 / p.meshGridDensity))
      for (let i = 0; i < emb.points.length; i += ringStep) {
        let prev: Vertex | null = null
        for (let lon = 0; lon <= nLon; lon++) {
          const v = vertexAt(i, lon % nLon)
          push(v, prev)
          prev = v
        }
      }
    }

    // --- Superficie del horizonte (limite de Smarr) ------------------------
    if (p.meshShowHorizon) {
      const he = horizonEmbedding(bh, 120)
      const tint: [number, number, number] = he.fails ? [1.0, 0.35, 0.5] : [0.9, 0.55, 0.2]
      // Meridianos del horizonte, desplazados al fondo de la garganta.
      const zBase = 0
      for (let lon = 0; lon < nLon; lon += 2) {
        let prev: Vertex | null = null
        for (let k = 0; k < he.profile.length; k += 3) {
          const pr = he.profile[k]
          const th = (2 * Math.PI * lon) / nLon
          const v: Vertex = {
            p: [pr.R * Math.cos(th), (zBase + pr.z) * hScale, pr.R * Math.sin(th)],
            color: tint,
          }
          push(v, prev)
          prev = v
        }
      }
    }

    if (verts.length === 0) return

    if (this.data.length < verts.length * 6) this.data = new Float32Array(verts.length * 6)
    for (let i = 0; i < verts.length; i++) {
      this.data.set(verts[i], i * 6)
    }

    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, this.data.subarray(0, verts.length * 6), gl.DYNAMIC_DRAW)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    this.prog.use()
    this.prog.f('u_opacity', 1)
    gl.drawArrays(gl.LINES, 0, verts.length)
    gl.disable(gl.BLEND)
    gl.bindVertexArray(null)
  }

  dispose(): void {
    this.gl.deleteBuffer(this.vbo)
    this.gl.deleteVertexArray(this.vao)
    this.prog.dispose()
  }
}

// --- Algebra vectorial minima ---------------------------------------------

function dot(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function norm(a: readonly [number, number, number]): [number, number, number] {
  const n = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / n, a[1] / n, a[2] / n]
}
