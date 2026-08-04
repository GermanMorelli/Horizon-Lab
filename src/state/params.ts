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
import { isotropicHorizonRadius, properSeparation } from '../physics/binary'
import { chirpMass } from '../physics/pn'
import { mergerFrequency, orbitalFrequencyHz, timeToMerger } from '../physics/waves'
import {
  equatorialEmbedding,
  horizonEmbedding,
  properRadialDistance,
} from '../physics/embedding'
import {
  diskMaxTemperature,
  gravitationalRadius,
  gravitationalTime,
  hawkingTemperature,
} from '../physics/units'

/** Limite de Thorne para acrecion astrofisica. */
export const SPIN_LIMIT = 0.998

export type DistanceMode = 'rg' | 'physical'

/**
 * Modo de visualizacion.
 *  - 'single': un agujero de Kerr-Newman (masa, carga y espin), trazado exacto.
 *  - 'binary': dos agujeros sobre datos iniciales de Brill-Lindquist. Exacto en
 *    las ligaduras de Einstein, NO en la evolucion; las orbitas las da la
 *    dinamica post-newtoniana.
 *  - 'mesh': geometria de la rebanada espacial (embedding de Flamm) y campo de
 *    dilatacion temporal.
 */
export type ViewMode = 'single' | 'binary' | 'mesh'

export interface SimParams {
  /** Modo de visualizacion. */
  mode: ViewMode

  // --- Binaria -------------------------------------------------------------
  /** Fraccion de masa del primer agujero, m1/(m1+m2), en (0, 1). */
  binaryMassRatio: number
  /** Semieje mayor inicial, en unidades de la masa total. */
  binarySeparation: number
  /** Excentricidad orbital inicial. */
  binaryEccentricity: number
  /** Si la orbita evoluciona por reaccion de radiacion. */
  binaryEvolving: boolean
  /** Factor de aceleracion del inspiral respecto al tiempo real. */
  binaryTimeScale: number
  /** Dibuja una rejilla sobre cada horizonte para distinguir las dos sombras. */
  binaryShowGrid: boolean
  /** Reproduce el chirp por audio. */
  chirpAudio: boolean

  // --- Malla del espaciotiempo --------------------------------------------
  /** Muestra la superficie del embedding isometrico (paraboloide de Flamm). */
  meshShowSurface: boolean
  /** Colorea la superficie por el lapso (dilatacion temporal). */
  meshShowLapse: boolean
  /** Radio exterior de la malla, en unidades de M. */
  meshOuterRadius: number
  /** Exageracion vertical del embedding (1 = isometrico exacto). */
  meshHeightScale: number
  /** Densidad de la rejilla. */
  meshGridDensity: number
  /** Muestra tambien la superficie del horizonte (limite de Smarr). */
  meshShowHorizon: boolean

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

  // --- Galaxias de fondo ---------------------------------------------------
  /**
   * Numero de galaxias de fondo (0-4).
   *
   * Van de FONDO y no en orbita: una galaxia es mucho mas masiva y mas grande que
   * cualquier agujero negro, asi que no lo orbita. Lo que si es real es su lente
   * gravitacional, que es lo que se traza.
   */
  galaxyCount: number
  galaxyBrightness: number
  /** Radio angular de las galaxias, en radianes. */
  galaxySize: number
  /** Intensidad de los brazos espirales; 0 = elipticas lisas. */
  galaxySpiral: number
  /**
   * Coloca una galaxia exactamente detras del agujero negro respecto a la camara,
   * que es la configuracion que produce un anillo de Einstein completo.
   */
  galaxyAlignBehind: boolean

  // --- Cuerpos de prueba animados ------------------------------------------
  /** Clave del catalogo de cuerpos (`BODY_CATALOG`). */
  bodyKind: string
  /** Con que reloj se anima: el del cuerpo o el del observador lejano. */
  bodyClock: 'proper' | 'coordinate'
  /** Animacion en marcha. */
  bodyPlaying: boolean
  /** Velocidad de la animacion, en unidades de M por segundo real. */
  bodySpeed: number
  /** Reiniciar el recorrido al terminar. */
  bodyLoop: boolean

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
  mode: 'single',

  binaryMassRatio: 0.55,
  binarySeparation: 40,
  binaryEccentricity: 0,
  binaryEvolving: false,
  binaryTimeScale: 1,
  binaryShowGrid: true,
  chirpAudio: false,

  meshShowSurface: true,
  meshShowLapse: true,
  meshOuterRadius: 18,
  meshHeightScale: 1,
  meshGridDensity: 1,
  meshShowHorizon: false,

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

  galaxyCount: 0,
  galaxyBrightness: 1,
  galaxySize: 0.06,
  galaxySpiral: 1,
  galaxyAlignBehind: true,

  bodyKind: 'sun',
  bodyClock: 'proper',
  bodyPlaying: true,
  bodySpeed: 40,
  bodyLoop: true,

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

  // --- Binaria -------------------------------------------------------------
  /** Masas de puntura, en unidades de la masa ADM total (suman 1). */
  binaryM1: number
  binaryM2: number
  /** Masa de chirp, en unidades de la masa total. */
  chirpMassGeom: number
  /** Masa de chirp en masas solares. */
  chirpMassSolar: number
  /** Frecuencia de la onda gravitacional en Hz. */
  gwFrequencyHz: number
  /** Tiempo hasta la fusion, en segundos. */
  mergerTimeSeconds: number
  /** Frecuencia gravitacional a la que corta el modelo de inspiral. */
  cutoffFrequencyHz: number
  /** Separacion propia entre los horizontes, en unidades de M. */
  binaryProperSeparation: number
  /** Radios isotropos de los dos horizontes. */
  binaryR1: number
  binaryR2: number

  // --- Malla ---------------------------------------------------------------
  /** Profundidad de la garganta del embedding, en unidades de M. */
  meshDepth: number
  /** true si el horizonte no admite inmersion euclidea (a/M > sqrt(3)/2). */
  horizonEmbeddingFails: boolean
  /** Distancia propia desde el horizonte hasta r = 10 M. */
  properDistanceToTen: number
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

  // --- Binaria -------------------------------------------------------------
  // Las masas de puntura se normalizan a masa ADM total 1, que para
  // Brill-Lindquist es exactamente m1 + m2.
  const bm1 = Math.min(Math.max(p.binaryMassRatio, 0.02), 0.98)
  const bm2 = 1 - bm1
  const mcGeom = chirpMass({ m1: bm1, m2: bm2 })
  const mcSolar = mcGeom * p.massSolar
  const fGw = orbitalFrequencyHz(p.binarySeparation, p.massSolar) * 2
  const fCut = mergerFrequency(bm1 * p.massSolar, bm2 * p.massSolar)
  const tMerge =
    fGw > 0 && fGw < fCut ? timeToMerger(fGw, bm1 * p.massSolar, bm2 * p.massSolar) : 0
  const punctures = [
    { m: bm1, pos: [-bm2 * p.binarySeparation, 0, 0] as [number, number, number] },
    { m: bm2, pos: [bm1 * p.binarySeparation, 0, 0] as [number, number, number] },
  ]

  // --- Malla ---------------------------------------------------------------
  const emb = equatorialEmbedding(bh, p.meshOuterRadius, 240)
  const horizonEmb = horizonEmbedding(bh, 400)

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

    binaryM1: bm1,
    binaryM2: bm2,
    chirpMassGeom: mcGeom,
    chirpMassSolar: mcSolar,
    gwFrequencyHz: fGw,
    mergerTimeSeconds: tMerge,
    cutoffFrequencyHz: fCut,
    binaryProperSeparation: properSeparation(punctures, 800),
    binaryR1: isotropicHorizonRadius(bm1),
    binaryR2: isotropicHorizonRadius(bm2),

    meshDepth: emb.depth,
    horizonEmbeddingFails: horizonEmb.fails,
    properDistanceToTen: h.hasHorizon
      ? properRadialDistance(h.rPlus * (1 + 1e-6), 10, bh, 2000)
      : NaN,
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
