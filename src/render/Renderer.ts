/**
 * Renderer WebGL2 del trazador.
 *
 * Estrategia de rendimiento, que es lo que hace la app usable sin sacrificar
 * fidelidad: mientras el usuario interactua se renderiza a resolucion reducida
 * con una sola muestra; al soltar, se sube a resolucion completa y se acumula
 * una muestra jittereada por frame (secuencia de Halton) hasta el objetivo. El
 * anillo de fotones y el fondo estelar lensado convergen sin ruido en 1-3 s.
 *
 * Cualquier cambio de camara o de parametro reinicia el acumulador.
 */

import {
  buildBlackbodyLUT,
  LUT_LOG_T_MAX,
  LUT_LOG_T_MIN,
  LUT_SIZE,
  relativeVisibleRadiance,
} from '../physics/blackbody'
import type { Derived, SimParams } from '../state/params'
import { OrbitOverlay } from './OrbitOverlay'
import {
  createDummyCubemap,
  createLUT,
  createRenderTarget,
  detectCaps,
  disposeTarget,
  halton,
  Program,
  type GLCaps,
  type RenderTarget,
} from './gl'

import quadVert from './shaders/quad.vert'
import kerrFrag from './shaders/kerr.frag'
import compositeFrag from './shaders/composite.frag'
import bloomFrag from './shaders/bloom.frag'

export interface RenderStats {
  samples: number
  targetSamples: number
  internalWidth: number
  internalHeight: number
  scale: number
  /** Milisegundos del ultimo pase de trazado (media movil). */
  frameMs: number
  converged: boolean
}

export class Renderer {
  private gl: WebGL2RenderingContext
  readonly caps: GLCaps
  /** true si hubo que degradar a RGBA8 sin acumulacion. */
  readonly degraded: boolean

  private progTrace: Program
  private progComposite: Program
  private progBloom: Program

  private accum: [RenderTarget, RenderTarget] | null = null
  /** Objetivo que contiene la acumulacion mas reciente. */
  private latest: RenderTarget | null = null
  private bloom: [RenderTarget, RenderTarget] | null = null
  private lut: WebGLTexture
  /** Relleno para el samplerCube del fondo; ver createDummyCubemap. */
  private dummyCube: WebGLTexture
  private vao: WebGLVertexArrayObject

  private sampleIndex = 0
  private internalW = 0
  private internalH = 0
  private currentScale = 0
  private frameMsAvg = 0
  /** Instante del ultimo pase que hizo trabajo, para medir el ritmo real. */
  private lastWorkAt = 0
  private colorFormat: number
  private colorType: number

  /** Calibracion del brillo del disco; ver u_diskBrightness en disk.glsl. */
  private diskBrightness = 1

  /** Numero de pases de trazado completados desde que se creo el renderer. */
  private tracedFrames = 0
  /**
   * Reduccion automatica de calidad. Multiplica la escala de resolucion cuando se
   * detecta que la GPU no llega; evita que un primer frame lentisimo deje la
   * pantalla en negro (o dispare el watchdog del driver) en equipos modestos.
   */
  private autoScale = 1
  /** true si el contexto WebGL se ha perdido. */
  private contextLost = false
  /** Se invoca cuando el contexto se pierde o se restaura. */
  onContextChange: ((lost: boolean) => void) | null = null
  /** Se invoca la primera vez que la calidad se reduce automaticamente. */
  onAutoDowngrade: ((scale: number, frameMs: number) => void) | null = null
  private downgradeNotified = false

  /**
   * @param preserveDrawingBuffer solo para las herramientas de captura: sin el,
   *   el contenido del canvas queda indefinido tras cada composicion y no se
   *   puede leer desde fuera de un callback de requestAnimationFrame.
   */
  constructor(
    private canvas: HTMLCanvasElement,
    preserveDrawingBuffer = false,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer,
      powerPreference: 'high-performance',
    })
    if (!gl) throw new Error('WebGL2 no disponible en este navegador.')
    this.gl = gl
    this.caps = detectCaps(gl)

    // RGBA16F es suficiente para la radiancia (la LUT ya guarda el rango en
    // logaritmo) y es filtrable en WebGL2 sin extensiones adicionales.
    if (this.caps.colorBufferFloat) {
      this.colorFormat = gl.RGBA16F
      this.colorType = gl.HALF_FLOAT
      this.degraded = false
    } else {
      this.colorFormat = gl.RGBA8
      this.colorType = gl.UNSIGNED_BYTE
      this.degraded = true
    }

    // La perdida de contexto es la causa mas comun de un canvas en negro sin
    // ningun error en consola: el driver reinicia la GPU (en Windows, el watchdog
    // TDR lo hace si un solo draw tarda demasiado) y todos los recursos mueren en
    // silencio. Sin este manejador el usuario ve negro y nada mas.
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault() // permite que el contexto pueda restaurarse
        this.contextLost = true
        this.onContextChange?.(true)
      },
      false,
    )
    canvas.addEventListener(
      'webglcontextrestored',
      () => {
        this.contextLost = false
        this.onContextChange?.(false)
      },
      false,
    )

    this.progTrace = new Program(gl, quadVert, kerrFrag, 'trazador Kerr-Newman')
    this.progComposite = new Program(gl, quadVert, compositeFrag, 'composite')
    this.progBloom = new Program(gl, quadVert, bloomFrag, 'bloom')

    this.lut = createLUT(gl, buildBlackbodyLUT(), LUT_SIZE)
    this.dummyCube = createDummyCubemap(gl)
    this.vao = gl.createVertexArray()!
    this.overlay = new OrbitOverlay(gl)
  }

  /** Overlay esquematico de orbitas de prueba. */
  readonly overlay: OrbitOverlay

  /** Reinicia la acumulacion: la imagen actual ya no es valida. */
  invalidate(): void {
    this.sampleIndex = 0
  }

  get stats(): RenderStats {
    return {
      samples: this.sampleIndex,
      targetSamples: 0,
      internalWidth: this.internalW,
      internalHeight: this.internalH,
      scale: this.currentScale,
      frameMs: this.frameMsAvg,
      converged: false,
    }
  }

  /**
   * Dibuja un frame. Devuelve las estadisticas, o null si no habia trabajo que
   * hacer (imagen ya convergida y nada invalidado).
   *
   * `realtime` significa que la imagen va a cambiar en el frame siguiente (el
   * usuario arrastra, o el disco esta rotando): se renderiza a resolucion
   * reducida con una sola muestra. En reposo se sube a resolucion plena y se
   * acumula. Acumular y animar son incompatibles: la media corrida solo
   * converge si la escena esta quieta.
   */
  render(p: SimParams, d: Derived, realtime: boolean): RenderStats | null {
    const gl = this.gl
    if (this.contextLost) return null

    // El PRIMER pase se hace siempre a baja resolucion, aunque estemos en reposo:
    // asi aparece una imagen en decimas de segundo en lugar de esperar un frame
    // completo a resolucion plena, que en una GPU modesta puede tardar segundos
    // (y con la pantalla en negro mientras tanto).
    const warmup = this.tracedFrames === 0
    const base = realtime || warmup ? p.interactiveScale : p.renderScale
    const scale = Math.max(0.12, base * this.autoScale)
    const target = this.degraded ? 1 : realtime || warmup ? 1 : Math.max(1, p.targetSamples)

    this.resize(scale)
    if (!this.accum) return null

    gl.bindVertexArray(this.vao)
    gl.disable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)

    // --- Pase de trazado -> acumulador -------------------------------------
    // Se omite cuando la imagen ya convergio. El composite, en cambio, se
    // ejecuta SIEMPRE: con preserveDrawingBuffer:false el contenido del canvas
    // queda indefinido tras cada composicion, asi que saltarselo lo deja en
    // negro. Como efecto secundario util, exposicion y bloom se actualizan al
    // instante sin necesidad de volver a trazar.
    const tracing = this.sampleIndex < target
    if (tracing) {
      const t0 = performance.now()
      const [src, dst] =
        this.sampleIndex % 2 === 0 ? this.accum : [this.accum[1], this.accum[0]]

      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo)
      gl.viewport(0, 0, this.internalW, this.internalH)

      this.progTrace.use()
      this.setTraceUniforms(p, d, realtime)
      this.progTrace.tex('u_prevAccum', 0, gl.TEXTURE_2D, src.tex)
      this.progTrace.tex('u_bbLUT', 1, gl.TEXTURE_2D, this.lut)
      // El samplerCube necesita su propia unidad aunque no se use (ver gl.ts).
      this.progTrace.tex('u_starCube', 2, gl.TEXTURE_CUBE_MAP, this.dummyCube)
      this.progTrace.f('u_sampleIndex', this.sampleIndex)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      this.sampleIndex++
      this.tracedFrames++
      this.latest = dst

      // Se mide el intervalo real entre pases que trazaron, no la duracion de
      // las llamadas GL: son asincronas y darian ~0.1 ms siempre.
      const wall = t0 - this.lastWorkAt
      if (this.lastWorkAt > 0 && wall > 0 && wall < 20000) {
        this.frameMsAvg = this.frameMsAvg === 0 ? wall : this.frameMsAvg * 0.85 + wall * 0.15
        this.applyAutoQuality(p)
      }
      this.lastWorkAt = t0
    }

    const latest = this.latest
    if (!latest) {
      gl.bindVertexArray(null)
      return null
    }

    // --- Bloom -------------------------------------------------------------
    const bloomTex = p.bloomEnabled && this.bloom ? this.renderBloom(latest, p) : null

    // --- Composite -> canvas ----------------------------------------------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.progComposite.use()
    this.progComposite.v2('u_resolution', this.canvas.width, this.canvas.height)
    this.progComposite.f('u_exposure', p.exposure)
    this.progComposite.b('u_bloomEnabled', !!bloomTex)
    this.progComposite.f('u_bloomStrength', p.bloomStrength)
    this.progComposite.tex('u_accum', 0, gl.TEXTURE_2D, latest.tex)
    this.progComposite.tex('u_bloom', 1, gl.TEXTURE_2D, bloomTex ?? latest.tex)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindVertexArray(null)

    // --- Overlay esquematico de orbitas (encima del tonemap) ---------------
    if (this.overlay && !this.overlay.isEmpty && p.showOrbits) {
      this.overlay.draw(
        {
          r: d.camDistanceRg,
          theta: p.inclination,
          phi: p.azimuth,
          tanHalfFov: Math.tan(p.fov / 2),
          aspect: this.internalW / Math.max(this.internalH, 1),
        },
        d.bh,
        p.orbitOpacity,
      )
    }

    return {
      samples: this.sampleIndex,
      targetSamples: target,
      internalWidth: this.internalW,
      internalHeight: this.internalH,
      scale: this.currentScale,
      frameMs: this.frameMsAvg,
      converged: this.sampleIndex >= target,
    }
  }

  /**
   * Reduce la resolucion interna si la GPU no llega, y la recupera si sobra
   * margen. Un solo pase demasiado largo es peligroso ademas de incomodo: en
   * Windows el watchdog del driver (TDR) reinicia la GPU si un draw pasa de ~2 s,
   * lo que pierde el contexto y deja el canvas en negro.
   */
  private applyAutoQuality(p: SimParams): void {
    if (!p.autoQuality) {
      this.autoScale = 1
      return
    }
    const ms = this.frameMsAvg
    const prev = this.autoScale
    if (ms > 900) this.autoScale = Math.max(0.2, this.autoScale * 0.6)
    else if (ms > 350) this.autoScale = Math.max(0.25, this.autoScale * 0.85)
    else if (ms < 90 && this.autoScale < 1) this.autoScale = Math.min(1, this.autoScale * 1.1)

    if (this.autoScale < prev && !this.downgradeNotified && this.autoScale < 0.9) {
      this.downgradeNotified = true
      this.onAutoDowngrade?.(this.autoScale, ms)
    }
  }

  /** true si aun no se ha completado ningun pase de trazado. */
  get hasRendered(): boolean {
    return this.tracedFrames > 0
  }

  get isContextLost(): boolean {
    return this.contextLost
  }

  private renderBloom(srcTarget: RenderTarget, p: SimParams): WebGLTexture | null {
    const gl = this.gl
    if (!this.bloom) return null
    const [b0, b1] = this.bloom

    gl.viewport(0, 0, b0.width, b0.height)
    this.progBloom.use()
    this.progBloom.v2('u_resolution', b0.width, b0.height)

    // Paso de brillo
    gl.bindFramebuffer(gl.FRAMEBUFFER, b0.fbo)
    this.progBloom.i('u_mode', 0)
    this.progBloom.f('u_threshold', p.bloomThreshold)
    this.progBloom.v2('u_texel', 1 / srcTarget.width, 1 / srcTarget.height)
    this.progBloom.tex('u_src', 0, gl.TEXTURE_2D, srcTarget.tex)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // Desenfoque horizontal
    gl.bindFramebuffer(gl.FRAMEBUFFER, b1.fbo)
    this.progBloom.i('u_mode', 1)
    this.progBloom.v2('u_texel', 1 / b0.width, 1 / b0.height)
    this.progBloom.v2('u_dir', 1, 0)
    this.progBloom.tex('u_src', 0, gl.TEXTURE_2D, b0.tex)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // Desenfoque vertical
    gl.bindFramebuffer(gl.FRAMEBUFFER, b0.fbo)
    this.progBloom.v2('u_dir', 0, 1)
    this.progBloom.tex('u_src', 0, gl.TEXTURE_2D, b1.tex)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    return b0.tex
  }

  private setTraceUniforms(p: SimParams, d: Derived, realtime: boolean): void {
    const t = this.progTrace
    const aspect = this.internalW / Math.max(this.internalH, 1)

    // Geometria
    t.f('u_a', p.spin)
    t.f('u_q', p.charge)

    // Camara: la posicion es (r, theta, phi) en Boyer-Lindquist.
    t.v3('u_camPos', d.camDistanceRg, p.inclination, p.azimuth)
    t.f('u_tanHalfFov', Math.tan(p.fov / 2))
    t.f('u_aspect', aspect)
    t.v2('u_resolution', this.internalW, this.internalH)

    // Jitter subpixel: centrado en la muestra interactiva, Halton al acumular.
    if (realtime || this.sampleIndex === 0) {
      t.v2('u_jitter', 0, 0)
    } else {
      const i = this.sampleIndex + 1
      t.v2('u_jitter', halton(i, 2) - 0.5, halton(i, 3) - 0.5)
    }

    // Integrador. En tiempo real se recorta el presupuesto de pasos.
    t.i('u_maxIter', realtime ? Math.round(p.maxIter * 0.55) : p.maxIter)
    t.f('u_tol', realtime ? p.tolerance * 20 : p.tolerance)
    t.f('u_rEscape', p.rEscape)
    t.f('u_rCapture', d.rCapture)
    // Paso inicial proporcional a la distancia de camara: arrancar demasiado
    // fino desperdicia iteraciones en el campo lejano.
    t.f('u_hInit', Math.max(0.05, d.camDistanceRg * 0.02))
    t.b('u_markNonConverged', p.markNonConverged)

    // Disco
    t.b('u_diskEnabled', p.diskEnabled)
    t.f('u_diskInner', d.rDiskInner)
    t.f('u_diskOuter', Math.max(p.diskOuter, d.rDiskInner * 1.2))
    t.f('u_diskTempMax', d.diskTempMaxK)
    t.f('u_diskBrightness', this.diskBrightness)
    t.f('u_diskOpacity', p.diskOpacity)
    t.f('u_diskTurbulence', p.diskTurbulence ? 1 : 0)
    t.f('u_diskPrograde', p.diskPrograde ? 1 : -1)
    t.f('u_diskTime', this.diskPhase)
    t.f('u_lutLogTMin', LUT_LOG_T_MIN)
    t.f('u_lutLogTMax', LUT_LOG_T_MAX)

    // Fondo
    t.b('u_starsEnabled', p.starsEnabled)
    t.f('u_starIntensity', p.starIntensity)
    t.f('u_starDensity', p.starDensity)
    t.f('u_milkyWayIntensity', p.milkyWayIntensity)
    t.b('u_useStarCube', false)

    // Capas
    t.b('u_showHorizon', p.showHorizon)
    t.b('u_showErgosphere', p.showErgosphere)
    t.b('u_showPhotonSphere', p.showPhotonSphere)
    t.b('u_showIsco', p.showIsco)
    t.b('u_showDragGrid', p.showDragGrid)
    t.f('u_iscoRadius', d.rDiskInner)
    t.f('u_photonRadius', p.diskPrograde ? d.rPhotonPrograde : d.rPhotonRetrograde)
    t.f('u_dragGridRadius', p.dragGridRadius)
    t.f('u_layerOpacity', p.layerOpacity)
  }

  /** Fase de rotacion del disco, en tiempo coordenado geometrico. */
  private diskPhase = 0

  /**
   * Avanza la fase del disco. Devuelve true si la fase cambio, en cuyo caso la
   * imagen acumulada deja de ser valida.
   *
   * El paso se escala con el periodo orbital del ISCO para que la rotacion
   * aparente sea comparable a cualquier masa (el periodo fisico va como M y
   * abarca de milisegundos a dias); la correspondencia real la reporta el HUD.
   */
  advanceTime(dtSeconds: number, p: SimParams, d: Derived): boolean {
    if (!p.diskEnabled || p.timeWarp <= 0) return false
    const omegaIsco = 1 / (Math.pow(d.rDiskInner, 1.5) + (p.diskPrograde ? p.spin : -p.spin))
    // Una vuelta completa del ISCO en ~12 s reales a timeWarp = 1.
    const periodGeom = (2 * Math.PI) / Math.abs(omegaIsco)
    this.diskPhase += (dtSeconds / 12) * periodGeom * p.timeWarp
    return true
  }

  /**
   * Recalcula la calibracion del brillo del disco.
   *
   * Con exposicion automatica se normaliza por la radiancia visible a T_max, de
   * modo que el pico del disco queda en DISK_TARGET a cualquier masa. Sin ella,
   * se normaliza por una referencia FIJA de 10^5 K y el brillo cambia realmente
   * con la masa (T ~ M^-1/4, y la radiancia visible ~ T).
   *
   * Se calibra el disco y no la exposicion global porque esta ultima escalaria
   * tambien el fondo estelar, que no tiene nada que ver con el agujero negro.
   */
  updateCalibration(p: SimParams, d: Derived): void {
    // Deja margen deliberado por encima: el beaming Doppler empuja un lado del
    // disco muy por encima de este valor, y si el pico se calibrase cerca de 1 el
    // tonemap recortaria ambos lados a blanco y borraria la asimetria.
    const DISK_TARGET = 0.55
    const FIXED_REF_K = 1e5
    const rel = relativeVisibleRadiance(
      p.autoExposure ? Math.max(d.diskTempMaxK, 1e3) : FIXED_REF_K,
    )
    this.diskBrightness = rel > 0 ? DISK_TARGET / rel : 1
  }

  /**
   * Ajusta el tamano del canvas y de los objetivos internos.
   * Un cambio de tamano invalida la acumulacion.
   */
  private resize(scale: number): void {
    const gl = this.gl
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = Math.max(1, this.canvas.clientWidth)
    const cssH = Math.max(1, this.canvas.clientHeight)
    const w = Math.round(cssW * dpr)
    const h = Math.round(cssH * dpr)

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
      this.invalidate()
    }

    const iw = Math.max(16, Math.round(w * scale))
    const ih = Math.max(16, Math.round(h * scale))

    if (iw === this.internalW && ih === this.internalH && this.accum) return

    disposeTarget(gl, this.accum?.[0] ?? null)
    disposeTarget(gl, this.accum?.[1] ?? null)
    disposeTarget(gl, this.bloom?.[0] ?? null)
    disposeTarget(gl, this.bloom?.[1] ?? null)

    this.internalW = iw
    this.internalH = ih
    this.currentScale = scale

    const mk = (ww: number, hh: number) =>
      createRenderTarget(gl, ww, hh, this.colorFormat, this.colorType)

    this.accum = [mk(iw, ih), mk(iw, ih)]
    this.latest = null
    const bw = Math.max(8, iw >> 1)
    const bh = Math.max(8, ih >> 1)
    this.bloom = [mk(bw, bh), mk(bw, bh)]
    this.invalidate()
  }

  /** Captura el canvas como PNG (data URL). */
  screenshot(): string {
    return this.canvas.toDataURL('image/png')
  }

  dispose(): void {
    const gl = this.gl
    disposeTarget(gl, this.accum?.[0] ?? null)
    disposeTarget(gl, this.accum?.[1] ?? null)
    disposeTarget(gl, this.bloom?.[0] ?? null)
    disposeTarget(gl, this.bloom?.[1] ?? null)
    gl.deleteTexture(this.lut)
    gl.deleteTexture(this.dummyCube)
    gl.deleteVertexArray(this.vao)
    this.progTrace.dispose()
    this.progComposite.dispose()
    this.progBloom.dispose()
    this.overlay.dispose()
  }
}
