/**
 * Orbitas de particulas de prueba en Kerr-Newman, neutras y cargadas.
 *
 * ---------------------------------------------------------------------------
 * Formulacion
 * ---------------------------------------------------------------------------
 * Para una particula de carga especifica eps = e/m el momento CANONICO es
 *
 *   pi_mu = p_mu + eps A_mu
 *
 * y el hamiltoniano  H = (1/2) g^{mu nu} (pi_mu - eps A_mu)(pi_nu - eps A_nu)
 * vale -1/2 para trayectorias temporales con tau como parametro afin.
 *
 * Como la metrica y el potencial son estacionarios y axisimetricos, pi_t = -E y
 * pi_phi = L siguen siendo constantes de movimiento, igual que para fotones.
 * El estado integrado es [t, r, theta, phi, pi_r, pi_theta].
 *
 * Es el UNICO lugar del proyecto donde la carga actua electromagneticamente. Los
 * fotones son neutros: la carga les afecta solo a traves de la metrica, via
 * Delta = r^2 - 2Mr + a^2 + Q^2. Aqui, en cambio, una particula cargada siente la
 * fuerza de Lorentz del campo del agujero, y su trayectoria se separa de la
 * geodesica neutra. El slider de carga tiene por tanto dos efectos cualitativa-
 * mente distintos, y este modulo hace visible el segundo.
 *
 * ---------------------------------------------------------------------------
 * Derivadas numericas
 * ---------------------------------------------------------------------------
 * A diferencia del trazador de fotones (que usa derivadas analiticas por estar en
 * el camino critico de la GPU), aqui se derivan H respecto de r y theta por
 * diferencias centradas de 5 puntos. Corre en CPU para un punado de orbitas, el
 * error es ~1e-10, y evita una pagina de algebra propensa a errores para el
 * termino electromagnetico. La conservacion de H a -1/2 lo verifica.
 */

import { emPotential, inverseMetric, metric, zamoTetrad, type BHParams } from './kerrNewman'
import { cashKarpStep, type RayState } from './geodesic'
import { brentRoot } from './rootfind'

/** Estado: [t, r, theta, phi, pi_r, pi_theta]. */
export type ParticleState = RayState

export interface ParticleConstants {
  /** E = -pi_t. */
  E: number
  /** L = pi_phi. */
  L: number
  /** Carga especifica eps = e/m. 0 = particula neutra. */
  eps: number
  /** 0 para fotones, 1 para particulas masivas. Fija el valor de 2H = -mu^2. */
  mu: number
}

const SIN_EPS = 1e-7

/**
 * Aparta theta del eje, donde 1/sin(theta) degenera en Boyer-Lindquist.
 * Se acota el ANGULO al valor cuyo seno es SIN_EPS, no se sustituye el angulo por
 * el epsilon: son cosas distintas y confundirlas desplaza el punto evaluado al
 * ecuador o al polo opuesto.
 */
function clampTheta(theta: number): number {
  const s = Math.sin(theta)
  if (Math.abs(s) >= SIN_EPS) return theta
  // Cerca de 0 o de pi, se empuja al primer angulo con |sin| = SIN_EPS.
  return Math.cos(theta) > 0 ? SIN_EPS : Math.PI - SIN_EPS
}

/**
 * Hamiltoniano. Debe mantenerse en -mu^2/2 a lo largo de la trayectoria:
 * -1/2 para particulas masivas, 0 para fotones.
 */
export function particleHamiltonian(
  y: ParticleState,
  k: ParticleConstants,
  p: BHParams,
): number {
  const r = y[1]
  const theta = y[2]
  const gi = inverseMetric(r, clampTheta(theta), p)
  const A = emPotential(r, theta, p)

  // p_mu = pi_mu - eps A_mu
  const p_t = -k.E - k.eps * A.A_t
  const p_phi = k.L - k.eps * A.A_phi
  const p_r = y[4]
  const p_th = y[5]

  return (
    0.5 *
    (gi.gtt * p_t * p_t +
      2 * gi.gtphi * p_t * p_phi +
      gi.gphiphi * p_phi * p_phi +
      gi.grr * p_r * p_r +
      gi.gthth * p_th * p_th)
  )
}

/**
 * Paso de diferenciacion, relativo.
 *
 * Para un stencil centrado de 5 puntos el error total es la suma del truncamiento
 * O(h^4) y del redondeo O(eps_mach/h), minimizada en h ~ eps_mach^(1/5) ~ 7e-4.
 * Elegir h demasiado pequeno es un error clasico: con h = 1e-5 el redondeo sube a
 * ~2e-11 y se convierte en un suelo de ruido que el controlador de paso adaptativo
 * intenta perseguir, encogiendo h hasta estancar la integracion.
 */
const DIFF_STEP = 1e-3

/**
 * Precision alcanzable de la derivada con DIFF_STEP: no tiene sentido pedirle al
 * integrador una tolerancia mas fina que esto.
 */
export const ORBIT_TOL_FLOOR = 1e-10

/**
 * Margen relativo sobre r_+ al que se declara la captura.
 *
 * No se persigue el horizonte exacto por dos razones que se refuerzan: en
 * Boyer-Lindquist dt/dtau diverge ahi (singularidad de coordenadas), y las
 * derivadas de H, que aqui son numericas, se vuelven enormes. El controlador de
 * paso lo interpreta como error creciente, encoge h y la integracion se estanca sin
 * llegar nunca a cruzar el umbral: se observaba una caida libre que agotaba 200.000
 * pasos y terminaba como 'complete' en vez de 'captured'.
 *
 * Un 1 % sobre r_+ (r = 2.02 en Schwarzschild) es visualmente indistinguible del
 * horizonte y deja las derivadas en un rango manejable.
 */
export const CAPTURE_MARGIN = 0.01

/** Derivada de H respecto de una coordenada, por diferencias centradas de 5 puntos. */
function dH(
  y: ParticleState,
  k: ParticleConstants,
  p: BHParams,
  index: 1 | 2,
  h: number,
): number {
  const shift = (d: number) => {
    const z = [...y] as ParticleState
    z[index] += d
    return particleHamiltonian(z, k, p)
  }
  return (-shift(2 * h) + 8 * shift(h) - 8 * shift(-h) + shift(-2 * h)) / (12 * h)
}

/** Lado derecho del sistema hamiltoniano para la particula. */
export function particleRHS(
  y: ParticleState,
  k: ParticleConstants,
  p: BHParams,
): ParticleState {
  const r = y[1]
  const theta = y[2]
  const gi = inverseMetric(r, clampTheta(theta), p)
  const A = emPotential(r, theta, p)

  const p_t = -k.E - k.eps * A.A_t
  const p_phi = k.L - k.eps * A.A_phi

  // dx^mu/dtau = dH/dpi_mu = g^{mu nu} p_nu
  const dt = gi.gtt * p_t + gi.gtphi * p_phi
  const dr = gi.grr * y[4]
  const dth = gi.gthth * y[5]
  const dphi = gi.gtphi * p_t + gi.gphiphi * p_phi

  // El paso radial se escala con r para mantener el error relativo uniforme
  // desde r ~ 1 hasta r ~ 1000; theta es de orden 1, asi que va absoluto.
  const hr = DIFF_STEP * Math.max(1, r)
  const hth = DIFF_STEP

  return [dt, dr, dth, dphi, -dH(y, k, p, 1, hr), -dH(y, k, p, 2, hth)]
}

// ---------------------------------------------------------------------------
// Condiciones iniciales
// ---------------------------------------------------------------------------

/**
 * Construye una particula a partir de su 3-velocidad local medida en el marco
 * ZAMO: `vLocal` = (v_r, v_theta, v_phi) con |v| < 1.
 *
 * Es la via mas general y reutiliza la tetrada ya validada, asi que sirve igual
 * para orbitas circulares, excentricas o inclinadas sin algebra especifica.
 */
export function particleFromLocalVelocity(
  r: number,
  theta: number,
  vLocal: [number, number, number],
  p: BHParams,
  eps = 0,
): { y: ParticleState; k: ParticleConstants } {
  const v2 = vLocal[0] ** 2 + vLocal[1] ** 2 + vLocal[2] ** 2
  if (v2 >= 1) throw new Error(`velocidad local |v| = ${Math.sqrt(v2)} >= c`)
  const gamma = 1 / Math.sqrt(1 - v2)

  const t = zamoTetrad(r, theta, p)
  // u^mu = gamma (e_0 + v_r e_r + v_th e_th + v_ph e_ph)
  const ut = gamma * t.e0[0]
  const ur = gamma * vLocal[0] * t.er[1]
  const uth = gamma * vLocal[1] * t.eth[2]
  const uph = gamma * (t.e0[3] + vLocal[2] * t.ephi[3])

  const g = metric(r, theta, p)
  const p_t = g.g_tt * ut + g.g_tphi * uph
  const p_r = g.g_rr * ur
  const p_th = g.g_thth * uth
  const p_phi = g.g_tphi * ut + g.g_phiphi * uph

  const A = emPotential(r, theta, p)
  return {
    y: [0, r, theta, 0, p_r, p_th],
    k: { E: -(p_t + eps * A.A_t), L: p_phi + eps * A.A_phi, eps, mu: 1 },
  }
}

/**
 * Orbita circular ecuatorial en r. La velocidad local del ZAMO se obtiene de la
 * velocidad angular de la orbita circular: v_phi = (Omega - omega) / alpha * ...
 * se resuelve numericamente pidiendo que dpi_r/dtau = 0, que es la condicion de
 * orbita circular y funciona igual con carga.
 */
export function circularParticle(
  r: number,
  p: BHParams,
  prograde = true,
  eps = 0,
): { y: ParticleState; k: ParticleConstants } {
  const theta = Math.PI / 2
  const sign = prograde ? 1 : -1

  // Se busca la velocidad azimutal local v tal que la fuerza radial se anule.
  const radialForce = (v: number) => {
    const { y, k } = particleFromLocalVelocity(r, theta, [0, 0, sign * v], p, eps)
    return particleRHS(y, k, p)[4] // dpi_r/dtau
  }

  // La fuerza radial es negativa (caida) a v = 0 y positiva (centrifuga) cerca de
  // v -> 1; hay una unica raiz entre medias.
  const v = brentRoot(radialForce, 1e-6, 0.999999, 1e-14)
  if (!Number.isFinite(v)) {
    throw new Error(`no existe orbita circular en r = ${r} (a=${p.a}, q=${p.q}, eps=${eps})`)
  }
  return particleFromLocalVelocity(r, theta, [0, 0, sign * v], p, eps)
}

// ---------------------------------------------------------------------------
// Integracion
// ---------------------------------------------------------------------------

export interface OrbitOptions {
  /**
   * Tolerancia relativa por paso. Se acota por debajo a ORBIT_TOL_FLOOR: pedir
   * mas precision que la de las derivadas numericas hace que el controlador de
   * paso persiga el ruido de redondeo y encoja h hasta detener la integracion.
   */
  tol?: number
  /** Numero maximo de pasos. */
  maxSteps?: number
  /** Parametro afin (tiempo propio) total a integrar. */
  tauMax?: number
  /** Radio de captura; por defecto r_+ (1 + CAPTURE_MARGIN). */
  rCapture?: number
  /** Radio a partir del cual se considera escapada. */
  rEscape?: number
  /** Guarda uno de cada `stride` pasos. */
  stride?: number
}

export interface OrbitResult {
  outcome: 'captured' | 'escaped' | 'complete' | 'maxSteps'
  /** Trayectoria en coordenadas de Boyer-Lindquist. */
  path: ParticleState[]
  /**
   * Tiempo PROPIO acumulado en cada punto del camino (el parametro afin, que para
   * una particula masiva con la normalizacion H = -1/2 es el tiempo propio).
   *
   * Se guarda aparte porque el tiempo COORDENADO ya viaja en path[i][0], y tener
   * los dos permite animar con cualquiera de los dos relojes. La diferencia no es
   * un detalle: en tiempo coordenado un cuerpo que cae parece frenarse y nunca
   * llega a cruzar el horizonte, mientras que en su propio reloj lo cruza en un
   * tiempo finito y perfectamente corriente.
   */
  properTime: number[]
  /** Trayectoria en pseudo-cartesianas (x, y, z), z = eje de espin. */
  cartesian: Array<[number, number, number]>
  steps: number
  tau: number
  /** Deriva maxima de H respecto de su valor inicial -1/2. */
  maxHamiltonianDrift: number
  /** Radios de periastro y apoastro observados. */
  rMin: number
  rMax: number
  /** Angulo azimutal total recorrido. */
  phiTotal: number
}

export function traceOrbit(
  y0: ParticleState,
  k: ParticleConstants,
  p: BHParams,
  opts: OrbitOptions = {},
): OrbitResult {
  const tol = Math.max(opts.tol ?? 1e-9, ORBIT_TOL_FLOOR)
  const maxSteps = opts.maxSteps ?? 200_000
  const tauMax = opts.tauMax ?? 2000
  const stride = opts.stride ?? 1
  const disc = 1 - p.a * p.a - p.q * p.q
  const rPlus = disc >= 0 ? 1 + Math.sqrt(disc) : 0
  const rCapture = opts.rCapture ?? (rPlus > 0 ? rPlus * (1 + CAPTURE_MARGIN) : 1e-3)
  const rEscape = opts.rEscape ?? 1e4

  const f = (s: ParticleState) => particleRHS(s, k, p)
  const H0 = particleHamiltonian(y0, k, p)

  let y = [...y0] as ParticleState
  let h = 0.05
  let tau = 0
  let steps = 0
  let outcome: OrbitResult['outcome'] = 'maxSteps'
  let maxDrift = 0
  let rMin = y[1]
  let rMax = y[1]

  const path: ParticleState[] = [[...y] as ParticleState]
  const properTime: number[] = [0]

  while (steps < maxSteps && tau < tauMax) {
    const hCap = Math.max(1e-9, 0.2 * (y[1] - rCapture))
    if (h > hCap) h = hCap

    const { y5, err } = cashKarpStep(y, h, f)
    if (err > tol && h > 1e-12) {
      h *= Math.max(0.2, 0.9 * Math.pow(tol / err, 0.2))
      continue
    }

    y = y5
    tau += h
    steps++

    rMin = Math.min(rMin, y[1])
    rMax = Math.max(rMax, y[1])
    maxDrift = Math.max(maxDrift, Math.abs(particleHamiltonian(y, k, p) - H0))

    if (steps % stride === 0) {
      path.push([...y] as ParticleState)
      properTime.push(tau)
    }

    if (y[1] <= rCapture) {
      outcome = 'captured'
      break
    }
    if (y[1] >= rEscape) {
      outcome = 'escaped'
      break
    }

    h *= Math.min(5, 0.9 * Math.pow(tol / Math.max(err, 1e-18), 0.2))
  }

  if (outcome === 'maxSteps' && tau >= tauMax) outcome = 'complete'

  // El ultimo estado se registra para que el camino llegue al final real (captura o
  // escape) y no al ultimo multiplo del stride. Se compara el TIEMPO y no la
  // identidad del array: se empujan copias, asi que comparar referencias nunca
  // detectaria el duplicado y el camino acabaria con dos muestras del mismo
  // instante, lo que rompe la monotonia que exige la interpolacion.
  if (properTime.length === 0 || tau > properTime[properTime.length - 1]) {
    path.push([...y] as ParticleState)
    properTime.push(tau)
  }

  return {
    outcome,
    path,
    properTime,
    cartesian: path.map(toCartesian),
    steps,
    tau,
    maxHamiltonianDrift: maxDrift,
    rMin,
    rMax,
    phiTotal: y[3] - y0[3],
  }
}

/**
 * Boyer-Lindquist -> pseudo-cartesianas para dibujar.
 *
 * ES UNA VISTA ESQUEMATICA. Estas no son coordenadas cartesianas de un espacio
 * plano: (r, theta, phi) etiquetan puntos de un espacio-tiempo curvo y esta
 * asignacion es una convencion de dibujo, no una proyeccion fisica. Dibujar la
 * orbita asi y superponerla a la imagen trazada mezcla dos cosas distintas: la
 * imagen viene de seguir la luz, y estas lineas no. Hacerlo bien exigiria trazar
 * geodesicas nulas desde cada punto de la orbita hasta la camara.
 */
export function toCartesian(y: ParticleState): [number, number, number] {
  const r = y[1]
  const th = y[2]
  const ph = y[3]
  return [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]
}

// ---------------------------------------------------------------------------
// Animacion a lo largo de la trayectoria
// ---------------------------------------------------------------------------

/** Con que reloj se recorre la trayectoria. */
export type Clock = 'proper' | 'coordinate'

export interface Snapshot {
  /** Posicion en Boyer-Lindquist. */
  x: [number, number, number]
  /** Posicion en pseudo-cartesianas para dibujar. */
  cart: [number, number, number]
  /** Tiempo propio y coordenado en este instante. */
  tau: number
  t: number
  /** Radio actual. */
  r: number
  /** Fraccion recorrida del camino, en [0, 1]. */
  progress: number
  /** true si se ha alcanzado el final del camino. */
  ended: boolean
}

/**
 * Duracion total del recorrido en el reloj elegido.
 *
 * Los dos relojes divergen brutalmente cerca del horizonte: para una caida, el
 * tiempo propio total es finito y modesto, mientras que el coordenado diverge. De
 * ahi que la animacion necesite saber en que reloj se le esta pidiendo avanzar.
 */
export function pathDuration(res: OrbitResult, clock: Clock): number {
  const n = res.path.length
  if (n < 2) return 0
  return clock === 'proper'
    ? res.properTime[n - 1] - res.properTime[0]
    : res.path[n - 1][0] - res.path[0][0]
}

/**
 * Estado del cuerpo en el instante `time` del reloj elegido, interpolando
 * linealmente entre los puntos registrados del camino.
 *
 * La interpolacion es lineal a proposito: el camino se muestrea con paso adaptativo
 * fino, asi que entre dos muestras consecutivas la trayectoria es practicamente
 * recta, y una interpolacion de orden superior no aportaria nada visible mientras
 * complicaria el manejo del cruce del eje.
 */
export function sampleAt(res: OrbitResult, time: number, clock: Clock): Snapshot | null {
  const n = res.path.length
  if (n === 0) return null
  const key = (i: number) => (clock === 'proper' ? res.properTime[i] : res.path[i][0])

  const t0 = key(0)
  const tEnd = key(n - 1)
  const total = tEnd - t0
  const clamped = Math.min(Math.max(time, 0), Math.max(total, 0))
  const target = t0 + clamped

  // Busqueda binaria del intervalo: el camino puede tener decenas de miles de
  // puntos y esto se llama en cada frame.
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (key(mid) <= target) lo = mid
    else hi = mid
  }

  const kA = key(lo)
  const kB = key(hi)
  const f = kB > kA ? (target - kA) / (kB - kA) : 0
  const a = res.path[lo]
  const b = res.path[hi]

  // El azimut puede dar muchas vueltas; interpolarlo directamente es correcto
  // porque no se envuelve en el estado.
  const x: [number, number, number] = [
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
    a[3] + (b[3] - a[3]) * f,
  ]
  const st = Math.sin(x[1])
  return {
    x,
    cart: [x[0] * st * Math.cos(x[2]), x[0] * st * Math.sin(x[2]), x[0] * Math.cos(x[1])],
    tau: res.properTime[lo] + (res.properTime[hi] - res.properTime[lo]) * f,
    t: a[0] + (b[0] - a[0]) * f,
    r: x[0],
    progress: total > 0 ? clamped / total : 1,
    ended: clamped >= total,
  }
}

/**
 * Radio minimo alcanzado y en que instante de cada reloj, para poder anunciar
 * cuando el cuerpo llega al periastro o al radio de marea.
 */
export function findFirstCrossing(
  res: OrbitResult,
  radius: number,
  clock: Clock,
): { time: number; index: number } | null {
  for (let i = 1; i < res.path.length; i++) {
    const rA = res.path[i - 1][1]
    const rB = res.path[i][1]
    if (rA > radius && rB <= radius) {
      const f = (rA - radius) / (rA - rB)
      const kA = clock === 'proper' ? res.properTime[i - 1] : res.path[i - 1][0]
      const kB = clock === 'proper' ? res.properTime[i] : res.path[i][0]
      const t0 = clock === 'proper' ? res.properTime[0] : res.path[0][0]
      return { time: kA + (kB - kA) * f - t0, index: i }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Observables de la orbita
// ---------------------------------------------------------------------------

/**
 * Precesion del periastro por orbita, en radianes.
 *
 * Se localizan los minimos sucesivos de r en la trayectoria y se mide el avance
 * de phi entre ellos, menos 2 pi. En campo debil debe tender a 6 pi M / p con p
 * el semi-latus rectum (el efecto de Mercurio).
 */
export function periastronPrecession(res: OrbitResult): number | null {
  return meanAdvanceExcess(apsidalPhis(res, 'peri'))
}

/**
 * Avance medio de phi entre eventos consecutivos, menos una revolucion completa.
 *
 * La vuelta se resta con el SIGNO del movimiento: en una orbita retrograda phi
 * decrece y el avance por vuelta es -2pi, asi que restar +2pi devolveria
 * -4pi + precesion en vez de la precesion.
 */
function meanAdvanceExcess(phis: number[]): number | null {
  if (phis.length < 2) return null
  let sum = 0
  for (let i = 1; i < phis.length; i++) sum += phis[i] - phis[i - 1]
  const mean = sum / (phis.length - 1)
  return mean - 2 * Math.PI * Math.sign(mean)
}

/**
 * Azimutes de los pasos por periastro (o apoastro) de la trayectoria.
 *
 * Se detectan por el cambio de signo de p_r, no buscando minimos locales de r:
 * como g_rr > 0 fuera del horizonte, sign(p_r) = sign(dr/dtau), y el periastro es
 * exactamente el cruce de - a +. Buscar minimos de r muestreados es fragil, porque
 * en una orbita casi circular el ruido numerico de r genera minimos espurios en
 * muestras adyacentes y la precesion medida sale ~0 (o -2pi tras restar la vuelta).
 */
export function apsidalPhis(res: OrbitResult, which: 'peri' | 'apo'): number[] {
  const path = res.path
  const out: number[] = []
  const rising = which === 'peri' // periastro: p_r pasa de negativo a positivo
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1][4]
    const b = path[i][4]
    const crossed = rising ? a < 0 && b >= 0 : a > 0 && b <= 0
    if (!crossed) continue
    const f = a / (a - b) // interpolacion lineal del cruce por cero
    out.push(path[i - 1][3] + f * (path[i][3] - path[i - 1][3]))
  }
  return out
}

/**
 * Precesion nodal de Lense-Thirring por orbita, en radianes: el avance del nodo
 * ascendente (cruce de theta = pi/2 con theta creciente) causado por el arrastre
 * de marcos. Es nula para a = 0.
 */
export function nodalPrecession(res: OrbitResult): number | null {
  const path = res.path
  const nodes: number[] = []
  for (let i = 1; i < path.length; i++) {
    const c0 = Math.cos(path[i - 1][2])
    const c1 = Math.cos(path[i][2])
    if (c0 > 0 && c1 <= 0) {
      const f = c0 / (c0 - c1)
      nodes.push(path[i - 1][3] + f * (path[i][3] - path[i - 1][3]))
    }
  }
  return meanAdvanceExcess(nodes)
}
