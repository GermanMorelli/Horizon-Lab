/**
 * Estado central de la simulacion y notificacion de cambios.
 *
 * Distingue dos tipos de cambio, y esa distincion es la que hace usable el
 * refinamiento progresivo:
 *  - `dirty`      : la imagen ya no es valida (parametros, camara) -> reiniciar acumulacion
 *  - `dirtyDerived`: hay que recalcular observables en CPU (r_+, ISCO, ...) y uniforms
 */

import {
  accretionEfficiency,
  captureRadius,
  ergosphereRadius,
  horizons,
  iscoRadius,
  photonCircularRadius,
  surfaceGravity,
  zamoLapse,
  frameDraggingOmega,
  type BHParams,
} from '../physics/kerrNewman'
import { shadowAngularRadius, shadowMetrics } from '../physics/shadowRim'
import {
  diskMaxTemperature,
  gravitationalRadius,
  gravitationalTime,
  hawkingTemperature,
} from '../physics/units'

/** Limite de Thorne para acrecion astrofisica. */
export const SPIN_LIMIT = 0.998

export type DistanceMode = 'rg' | 'physical'

export interface SimParams {
  // --- Agujero negro -------------------------------------------------------
  /** Masa en masas solares. */
  massSolar: number
  /** a = J/M^2, con signo (negativo = espin retrogrado respecto al disco). */
  spin: number
  /** q = Q/M. */
  charge: number

  // --- Camara --------------------------------------------------------------
  /** Distancia en unidades de M (radios gravitacionales). */
  distanceRg: number
  /** Distancia fisica en metros (modo 'physical'). */
  distanceMeters: number
  /** Como se interpreta la distancia. Ver README, seccion de la masa. */
  distanceMode: DistanceMode
  /** Inclinacion de la camara respecto al eje de espin, en radianes. */
  inclination: number
  /** Azimut de la camara, en radianes. */
  azimuth: number
  /** Campo de vision vertical, en radianes. */
  fov: number

  // --- Disco ---------------------------------------------------------------
  diskEnabled: boolean
  /** Radio externo en unidades de M. */
  diskOuter: number
  /** Fraccion de Eddington de la tasa de acrecion. */
  eddingtonRatio: number
  diskOpacity: number
  diskTurbulence: boolean
  /** true = corrotante con el espin. */
  diskPrograde: boolean
  /** Multiplicador de la velocidad de rotacion visible. */
  timeWarp: number

  // --- Fondo ---------------------------------------------------------------
  starsEnabled: boolean
  starIntensity: number
  starDensity: number
  milkyWayIntensity: number

  // --- Capas geometricas ---------------------------------------------------
  showHorizon: boolean
  showErgosphere: boolean
  showPhotonSphere: boolean
  showIsco: boolean
  showDragGrid: boolean
  dragGridRadius: number
  layerOpacity: number

  // --- Trazador de orbitas de prueba ---------------------------------------
  showOrbits: boolean
  orbitOpacity: number
  /** Radio de lanzamiento de la particula, en unidades de M. */
  orbitLaunchRadius: number
  /** Inclinacion de la orbita respecto al plano ecuatorial, en radianes. */
  orbitInclination: number
  /** Fraccion de la velocidad circular local (1 = orbita circular). */
  orbitSpeedFraction: number
  /** Carga especifica eps = e/m de la particula de prueba. */
  orbitCharge: number
  /** Sentido de la orbita respecto al espin. */
  orbitPrograde: boolean
  /** Numero de orbitas a integrar. */
  orbitRevolutions: number

  // --- Render --------------------------------------------------------------
  /** Escala de resolucion interna en reposo. */
  renderScale: number
  /** Escala de resolucion mientras se interactua. */
  interactiveScale: number
  /** Tope de iteraciones del integrador por rayo. */
  maxIter: number
  /** Tolerancia relativa por paso. */
  tolerance: number
  /** Radio a partir del cual se considera que el rayo escapa. */
  rEscape: number
  /** Muestras a acumular en reposo. */
  targetSamples: number
  exposure: number
  autoExposure: boolean
  bloomEnabled: boolean
  bloomStrength: number
  bloomThreshold: number
  /** Modo diagnostico: pinta de magenta los rayos que no convergieron. */
  markNonConverged: boolean
  /**
   * Ajusta la resolucion interna a la velocidad real de la GPU. Conviene dejarlo
   * activo: un solo pase demasiado lento puede disparar el watchdog del driver y
   * perder el contexto WebGL, lo que deja el canvas en negro.
   */
  autoQuality: boolean
}

export const DEFAULT_PARAMS: SimParams = {
  massSolar: 6.5e9,
  spin: 0.9,
  charge: 0,

  // El encuadre importa: el cuadro abarca 2 r tan(fov/2) unidades de M en el
  // plano central, y el disco tiene 2 r_out de diametro. Con r = 60 y fov = 40
  // el cuadro cubre ~44 M y un disco de r_out = 18 (36 M) entra holgado, con la
  // sombra (~10 M de diametro) ocupando un 23% del ancho. Camara mas cerca o fov
  // mas amplio y el disco desborda el cuadro por completo.
  distanceRg: 60,
  distanceMeters: 5.23e23, // ~16.8 Mpc, la distancia a M87*
  distanceMode: 'rg',
  inclination: (78 * Math.PI) / 180,
  azimuth: 0,
  fov: (40 * Math.PI) / 180,

  diskEnabled: true,
  diskOuter: 18,
  eddingtonRatio: 0.1,
  diskOpacity: 1,
  diskTurbulence: true,
  diskPrograde: true,
  // Arranca pausado a proposito: con la escena quieta la imagen converge a
  // calidad plena en 1-3 s. Rotar el disco fuerza el modo de tiempo real (una
  // muestra, resolucion reducida). Barra espaciadora alterna.
  timeWarp: 0,

  starsEnabled: true,
  starIntensity: 1,
  starDensity: 0.5,
  milkyWayIntensity: 0.35,

  showHorizon: false,
  showErgosphere: false,
  showPhotonSphere: false,
  showIsco: false,
  showDragGrid: false,
  dragGridRadius: 8,
  layerOpacity: 0.8,

  showOrbits: true,
  orbitOpacity: 0.9,
  orbitLaunchRadius: 14,
  orbitInclination: (25 * Math.PI) / 180,
  orbitSpeedFraction: 0.97,
  orbitCharge: 0,
  orbitPrograde: true,
  orbitRevolutions: 6,

  renderScale: 1,
  interactiveScale: 0.4,
  maxIter: 900,
  tolerance: 1e-5,
  rEscape: 300,
  targetSamples: 192,
  exposure: 1,
  autoExposure: true,
  bloomEnabled: true,
  bloomStrength: 0.55,
  bloomThreshold: 1,
  markNonConverged: false,
  autoQuality: true,
}

// ---------------------------------------------------------------------------
// Observables derivados
// ---------------------------------------------------------------------------

export interface Derived {
  bh: BHParams
  /** a^2 + q^2; > 1 significa singularidad desnuda. */
  extremality: number
  hasHorizon: boolean
  isExtremal: boolean
  rPlus: number
  rMinus: number
  rErgoEquator: number
  rErgoPole: number
  rPhotonPrograde: number
  rPhotonRetrograde: number
  rIscoPrograde: number
  rIscoRetrograde: number
  /** ISCO efectivo del disco segun su sentido de rotacion. */
  rDiskInner: number
  surfaceGravity: number
  hawkingTempK: number
  efficiency: number
  /** Radio areal de la sombra en unidades de M/r_obs. */
  shadowArealRadius: number
  shadowAsymmetry: number
  /** Radio angular de la sombra visto desde la camara, en radianes. */
  shadowAngularRad: number
  /** Radio gravitacional en metros. */
  rgMeters: number
  /** Escala temporal GM/c^3 en segundos. */
  tgSeconds: number
  /** Distancia efectiva de la camara en unidades de M. */
  camDistanceRg: number
  /** Dilatacion temporal del observador (lapso ZAMO). */
  camLapse: number
  /** Arrastre de marcos en la posicion de la camara. */
  camOmega: number
  diskTempMaxK: number
  /** Periodo orbital en el ISCO, en segundos. */
  iscoPeriodSeconds: number
  /** Radio de captura de rayos usado por el shader. */
  rCapture: number
}

export function computeDerived(p: SimParams): Derived {
  const bh: BHParams = { a: p.spin, q: p.charge }
  const h = horizons(bh)
  const prograde = p.diskPrograde

  const rIscoPro = iscoRadius(bh, true)
  const rIscoRetro = iscoRadius(bh, false)
  const rDiskInner = prograde ? rIscoPro : rIscoRetro

  // En modo 'rg' la distancia se mide en M y la geometria de la imagen no
  // cambia con la masa; en modo 'physical' la masa fija el tamano angular.
  const rgMeters = gravitationalRadius(p.massSolar)
  const camDistanceRg =
    p.distanceMode === 'rg' ? p.distanceRg : Math.max(p.distanceMeters / rgMeters, 2.2)

  const kappa = surfaceGravity(bh)
  const sm = shadowMetrics(bh, p.inclination, 256)

  const diskTempMaxK = diskMaxTemperature(p.massSolar, p.eddingtonRatio)
  const tgSeconds = gravitationalTime(p.massSolar)

  // Periodo orbital en el ISCO: T = 2 pi / Omega en unidades de M, x GM/c^3.
  const omegaIsco = 1 / (Math.pow(rDiskInner, 1.5) + (prograde ? bh.a : -bh.a))
  const iscoPeriodSeconds = ((2 * Math.PI) / Math.abs(omegaIsco)) * tgSeconds

  return {
    bh,
    extremality: bh.a * bh.a + bh.q * bh.q,
    hasHorizon: h.hasHorizon,
    isExtremal: h.isExtremal,
    rPlus: h.rPlus,
    rMinus: h.rMinus,
    rErgoEquator: ergosphereRadius(Math.PI / 2, bh),
    rErgoPole: ergosphereRadius(0, bh),
    rPhotonPrograde: photonCircularRadius(bh, true),
    rPhotonRetrograde: photonCircularRadius(bh, false),
    rIscoPrograde: rIscoPro,
    rIscoRetrograde: rIscoRetro,
    rDiskInner,
    surfaceGravity: kappa,
    hawkingTempK: Number.isFinite(kappa) ? hawkingTemperature(kappa, p.massSolar) : NaN,
    efficiency: accretionEfficiency(bh, prograde),
    shadowArealRadius: sm.rAreal,
    shadowAsymmetry: sm.asymmetry,
    shadowAngularRad: shadowAngularRadius(camDistanceRg, bh, p.inclination),
    rgMeters,
    tgSeconds,
    camDistanceRg,
    camLapse: zamoLapse(camDistanceRg, p.inclination, bh),
    camOmega: frameDraggingOmega(camDistanceRg, p.inclination, bh),
    diskTempMaxK,
    iscoPeriodSeconds,
    rCapture: captureRadius(bh),
  }
}

// ---------------------------------------------------------------------------
// Almacen observable
// ---------------------------------------------------------------------------

type Listener = (p: SimParams, d: Derived) => void

export class ParamStore {
  private params: SimParams
  private derived: Derived
  private listeners = new Set<Listener>()

  constructor(initial: SimParams = DEFAULT_PARAMS) {
    this.params = { ...initial }
    this.derived = computeDerived(this.params)
  }

  get(): Readonly<SimParams> {
    return this.params
  }

  getDerived(): Readonly<Derived> {
    return this.derived
  }

  /** Aplica un parche y notifica. Recalcula los derivados siempre. */
  patch(patch: Partial<SimParams>): void {
    let changed = false
    for (const [k, v] of Object.entries(patch) as Array<[keyof SimParams, never]>) {
      if (this.params[k] !== v) {
        this.params[k] = v
        changed = true
      }
    }
    if (!changed) return
    this.clampSpin()
    this.derived = computeDerived(this.params)
    for (const l of this.listeners) l(this.params, this.derived)
  }

  /**
   * El espin se acota al limite de Thorne. La carga NO se acota a
   * a^2 + q^2 <= 1: dejar entrar en el regimen de singularidad desnuda es
   * intencionado (es una solucion matematicamente valida y muy instructiva),
   * y la UI lo senala con una advertencia.
   */
  private clampSpin(): void {
    this.params.spin = Math.max(-SPIN_LIMIT, Math.min(SPIN_LIMIT, this.params.spin))
    this.params.charge = Math.max(0, Math.min(1.4, this.params.charge))
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l)
    l(this.params, this.derived)
    return () => this.listeners.delete(l)
  }
}
