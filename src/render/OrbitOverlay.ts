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

import {
  sampleAt,
  toCartesian,
  type Clock,
  type OrbitResult,
  type Snapshot,
} from '../physics/orbits'
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
  /**
   * Cuerpo animado sobre esta trayectoria, si lo hay.
   *
   * El resultado completo del trazado se conserva para poder muestrear la posicion
   * en cualquier instante de cualquiera de los dos relojes, en lugar de recalcular
   * la orbita en cada frame.
   */
  body?: {
    result: OrbitResult
    /** Radio del marcador en unidades de M (el radio fisico del cuerpo). */
    radiusRg: number
    /** Radio de marea en unidades de M; NaN si no aplica. */
    tidalRg: number
    /** Color del cuerpo en RGB lineal. */
    bodyColor: [number, number, number]
    /** Tiempo transcurrido en el reloj activo. */
    time: number
    /** Duracion total en cada reloj. */
    durationProper: number
    durationCoordinate: number
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
   * Avanza el reloj de todos los cuerpos animados.
   * @param dt incremento en el reloj elegido, en unidades geometricas de M
   * @param loop si al terminar el recorrido se reinicia
   * @returns true si algun cuerpo se movio
   */
  advance(dt: number, clock: Clock, loop: boolean): boolean {
    let moved = false
    for (const t of this.traces) {
      if (!t.body) continue
      const total = clock === 'proper' ? t.body.durationProper : t.body.durationCoordinate
      if (total <= 0) continue
      t.body.time += dt
      if (t.body.time >= total) t.body.time = loop ? t.body.time % total : total
      moved = true
    }
    return moved
  }

  /** Reinicia el reloj de todos los cuerpos. */
  rewind(): void {
    for (const t of this.traces) if (t.body) t.body.time = 0
  }

  /** Estado actual de los cuerpos animados, para el HUD. */
  bodyStates(clock: Clock): Array<{
    trace: OrbitTrace
    snap: Snapshot
    disrupted: boolean
  }> {
    const out: Array<{ trace: OrbitTrace; snap: Snapshot; disrupted: boolean }> = []
    for (const t of this.traces) {
      if (!t.body) continue
      const snap = sampleAt(t.body.result, t.body.time, clock)
      if (!snap) continue
      out.push({
        trace: t,
        snap,
        disrupted: Number.isFinite(t.body.tidalRg) && snap.r <= t.body.tidalRg,
      })
    }
    return out
  }

  /**
   * Dibuja las orbitas sobre el framebuffer actual.
   * Debe llamarse DESPUES del composite, ya que compone en espacio de pantalla.
   */
  draw(cam: OverlayCamera, bh: BHParams, opacity: number, clock: Clock = 'proper'): void {
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

    // --- Marcadores de los cuerpos animados --------------------------------
    for (const trace of this.traces) {
      if (!trace.body) continue
      const snap = sampleAt(trace.body.result, trace.body.time, clock)
      if (!snap) continue
      this.drawBodyMarker(trace, snap, C, rHat, thHat, phHat, cam, rBlock)
    }

    gl.disable(gl.BLEND)
    gl.bindVertexArray(null)
  }

  /**
   * Marcador del cuerpo: una circunferencia en la posicion interpolada, de radio
   * igual al tamano angular real del cuerpo (con un minimo en pixeles para que siga
   * siendo visible cuando es diminuto, que es el caso habitual).
   *
   * Se dibuja con la misma proyeccion recta que las lineas, asi que hereda la misma
   * limitacion declarada: es un diagrama superpuesto, no luz trazada.
   */
  private drawBodyMarker(
    trace: OrbitTrace,
    snap: Snapshot,
    C: [number, number, number],
    rHat: [number, number, number],
    thHat: [number, number, number],
    phHat: [number, number, number],
    cam: OverlayCamera,
    rBlock: number,
  ): void {
    const gl = this.gl
    const body = trace.body!
    const P = snap.cart

    const dx = P[0] - C[0]
    const dy = P[1] - C[1]
    const dz = P[2] - C[2]
    const aR = dx * rHat[0] + dy * rHat[1] + dz * rHat[2]
    const aT = dx * thHat[0] + dy * thHat[1] + dz * thHat[2]
    const aP = dx * phHat[0] + dy * phHat[1] + dz * phHat[2]
    const s = -aR
    if (s <= 1e-6) return

    const cxNdc = aP / (s * cam.tanHalfFov * cam.aspect)
    const cyNdc = -aT / (s * cam.tanHalfFov)

    // Ocultacion por el agujero, igual que las lineas.
    let fade = 1
    if (rBlock > 0) {
      const len2 = dx * dx + dy * dy + dz * dz
      if (len2 > 1e-12) {
        const u = -(C[0] * dx + C[1] * dy + C[2] * dz) / len2
        if (u > 0 && u < 1) {
          const qx = C[0] + u * dx
          const qy = C[1] + u * dy
          const qz = C[2] + u * dz
          const dist = Math.sqrt(qx * qx + qy * qy + qz * qz)
          fade = Math.min(1, Math.max(0, (dist - rBlock) / (0.6 * rBlock)))
        }
      }
    }
    if (fade <= 0.01) return

    // Radio angular del cuerpo -> radio en NDC. Se impone un minimo para que un
    // planeta (que a escala del agujero es un punto) siga siendo visible.
    const dist3 = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const angRad = Math.atan(body.radiusRg / Math.max(dist3, 1e-6))
    const rNdc = Math.max(angRad / cam.tanHalfFov, 0.012)

    // Rojo si esta dentro del radio de marea: se esta desgarrando.
    const disrupted = Number.isFinite(body.tidalRg) && snap.r <= body.tidalRg
    const col = disrupted ? ([1.0, 0.28, 0.2] as [number, number, number]) : body.bodyColor

    // Circunferencia como tira de lineas cerrada, mas una cruz central para que se
    // localice bien cuando el circulo es minimo.
    const N = 28
    const need = (N + 1 + 5) * 3
    if (this.scratch.length < need) this.scratch = new Float32Array(need)
    const buf = this.scratch
    let n = 0
    for (let i = 0; i <= N; i++) {
      const a = (2 * Math.PI * i) / N
      buf[n * 3] = cxNdc + rNdc * Math.cos(a) * (1 / cam.aspect)
      buf[n * 3 + 1] = cyNdc + rNdc * Math.sin(a)
      buf[n * 3 + 2] = fade
      n++
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, buf.subarray(0, n * 3), gl.DYNAMIC_DRAW)
    this.prog.v3('u_color', col[0], col[1], col[2])
    gl.drawArrays(gl.LINE_STRIP, 0, n)

    // Cruz central.
    const k = rNdc * 0.55
    const cross: number[] = [
      cxNdc - k / cam.aspect, cyNdc, fade,
      cxNdc + k / cam.aspect, cyNdc, fade,
      cxNdc, cyNdc - k, fade,
      cxNdc, cyNdc + k, fade,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cross), gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.LINES, 0, 4)
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
