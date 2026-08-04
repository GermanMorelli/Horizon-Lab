/**
 * Camara orbital: arrastrar para rotar, rueda o pinza para acercar.
 *
 * Usa Pointer Events, que cubre raton, tactil y lapiz con un solo camino de
 * codigo. La inercia con amortiguacion se aplica tambien al zoom para que el
 * refinamiento progresivo no arranque mientras el movimiento sigue decayendo.
 */

import { SPIN_LIMIT } from '../state/params'

export interface OrbitState {
  /** Inclinacion respecto al eje de espin, en radianes (0 = polo norte). */
  inclination: number
  /** Azimut, en radianes. */
  azimuth: number
  /** Distancia en unidades de M. */
  distance: number
}

export interface OrbitCameraOptions {
  minDistance: number
  maxDistance: number
  /** Sensibilidad de rotacion en radianes por pixel. */
  rotateSpeed: number
  /** Amortiguacion por frame (0 = sin inercia, ->1 = muy deslizante). */
  damping: number
  onChange: (s: OrbitState, interacting: boolean) => void
}

const DEFAULTS: Omit<OrbitCameraOptions, 'onChange'> = {
  minDistance: 2.2,
  maxDistance: 4000,
  rotateSpeed: 0.006,
  damping: 0.86,
}

/** Margen para que la camara no toque los polos, donde 1/sin(theta) degenera. */
const POLE_EPS = 0.02

export class OrbitCamera {
  private opts: OrbitCameraOptions
  private state: OrbitState
  private velIncl = 0
  private velAzim = 0
  private velZoom = 0
  private dragging = false
  private pointers = new Map<number, { x: number; y: number }>()
  private lastPinchDist = 0
  private lastX = 0
  private lastY = 0
  private idleFrames = 0
  private disposed = false
  private detach: Array<() => void> = []

  constructor(
    private canvas: HTMLCanvasElement,
    initial: OrbitState,
    options: Partial<OrbitCameraOptions> & Pick<OrbitCameraOptions, 'onChange'>,
  ) {
    this.opts = { ...DEFAULTS, ...options }
    this.state = { ...initial }
    this.attach()
  }

  get(): Readonly<OrbitState> {
    return this.state
  }

  /** Fija el estado desde fuera (presets, sliders del panel). */
  set(partial: Partial<OrbitState>, resetVelocity = true): void {
    Object.assign(this.state, partial)
    this.clamp()
    if (resetVelocity) {
      this.velIncl = 0
      this.velAzim = 0
      this.velZoom = 0
    }
    this.opts.onChange(this.state, false)
  }

  setDistanceLimits(min: number, max: number): void {
    this.opts.minDistance = min
    this.opts.maxDistance = max
    this.clamp()
  }

  /** true mientras el usuario arrastra o queda inercia por disipar. */
  get isInteracting(): boolean {
    return this.dragging || this.idleFrames < 2
  }

  private attach(): void {
    const c = this.canvas

    const onPointerDown = (e: PointerEvent) => {
      c.setPointerCapture(e.pointerId)
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.pointers.size === 1) {
        this.dragging = true
        this.lastX = e.clientX
        this.lastY = e.clientY
        this.velIncl = 0
        this.velAzim = 0
      } else if (this.pointers.size === 2) {
        this.lastPinchDist = this.pinchDistance()
      }
      c.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (this.pointers.size >= 2) {
        // Pinza: dos dedos controlan la distancia.
        const d = this.pinchDistance()
        if (this.lastPinchDist > 0 && d > 0) {
          const ratio = this.lastPinchDist / d
          this.state.distance *= ratio
          this.clamp()
          this.emit(true)
        }
        this.lastPinchDist = d
        return
      }

      if (!this.dragging) return
      const dx = e.clientX - this.lastX
      const dy = e.clientY - this.lastY
      this.lastX = e.clientX
      this.lastY = e.clientY

      // El arrastre en pantalla se traduce en giro azimutal y de inclinacion.
      this.velAzim = -dx * this.opts.rotateSpeed
      this.velIncl = -dy * this.opts.rotateSpeed
      this.state.azimuth += this.velAzim
      this.state.inclination += this.velIncl
      this.clamp()
      this.emit(true)
    }

    const onPointerUp = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId)
      if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId)
      if (this.pointers.size === 0) {
        this.dragging = false
        c.style.cursor = 'grab'
      }
      if (this.pointers.size < 2) this.lastPinchDist = 0
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // deltaMode 1 = lineas, 2 = paginas: normalizar a algo comparable a px.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1
      this.velZoom += (e.deltaY * unit) / 900
    }

    const onContextMenu = (e: Event) => e.preventDefault()

    c.addEventListener('pointerdown', onPointerDown)
    c.addEventListener('pointermove', onPointerMove)
    c.addEventListener('pointerup', onPointerUp)
    c.addEventListener('pointercancel', onPointerUp)
    c.addEventListener('wheel', onWheel, { passive: false })
    c.addEventListener('contextmenu', onContextMenu)
    c.style.cursor = 'grab'
    c.style.touchAction = 'none'

    this.detach = [
      () => c.removeEventListener('pointerdown', onPointerDown),
      () => c.removeEventListener('pointermove', onPointerMove),
      () => c.removeEventListener('pointerup', onPointerUp),
      () => c.removeEventListener('pointercancel', onPointerUp),
      () => c.removeEventListener('wheel', onWheel),
      () => c.removeEventListener('contextmenu', onContextMenu),
    ]
  }

  /**
   * Avanza la inercia un frame. Debe llamarse desde el bucle de render, y su
   * valor de retorno indica si la camara se movio (para reiniciar la acumulacion).
   */
  update(): boolean {
    if (this.disposed) return false
    let moved = false

    if (!this.dragging && (Math.abs(this.velIncl) > 1e-6 || Math.abs(this.velAzim) > 1e-6)) {
      this.state.azimuth += this.velAzim
      this.state.inclination += this.velIncl
      this.velAzim *= this.opts.damping
      this.velIncl *= this.opts.damping
      moved = true
    }

    if (Math.abs(this.velZoom) > 1e-5) {
      this.state.distance *= Math.exp(this.velZoom)
      this.velZoom *= this.opts.damping
      moved = true
    }

    if (moved) {
      this.clamp()
      this.emit(true)
      this.idleFrames = 0
    } else if (this.dragging) {
      this.idleFrames = 0
    } else {
      this.idleFrames++
    }

    return moved
  }

  private emit(interacting: boolean): void {
    this.idleFrames = 0
    this.opts.onChange(this.state, interacting)
  }

  private pinchDistance(): number {
    const pts = [...this.pointers.values()]
    if (pts.length < 2) return 0
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
  }

  /**
   * Acota la inclinacion fuera de los polos exactos y la distancia al rango
   * valido. El margen polar evita el 1/sin(theta) de Boyer-Lindquist justo en
   * el eje; ver la nota sobre el eje en geodesic.ts.
   */
  private clamp(): void {
    this.state.inclination = Math.max(
      POLE_EPS,
      Math.min(Math.PI - POLE_EPS, this.state.inclination),
    )
    this.state.distance = Math.max(
      this.opts.minDistance,
      Math.min(this.opts.maxDistance, this.state.distance),
    )
    // Mantener el azimut acotado evita perder precision en sin/cos tras muchas
    // vueltas de arrastre.
    const twoPi = Math.PI * 2
    this.state.azimuth = ((this.state.azimuth % twoPi) + twoPi) % twoPi
  }

  dispose(): void {
    this.disposed = true
    for (const fn of this.detach) fn()
    this.detach = []
  }
}

/** Distancia minima segura de la camara para un espin y carga dados. */
export function minSafeDistance(spin: number, charge: number): number {
  const disc = 1 - spin * spin - charge * charge
  const rPlus = disc >= 0 ? 1 + Math.sqrt(disc) : 0
  // Un margen sobre el horizonte: la camara ZAMO existe hasta r_+, pero muy
  // cerca el lapso tiende a 0 y la imagen deja de ser informativa.
  return Math.max(2.2, rPlus * 1.35)
}

export { SPIN_LIMIT }
