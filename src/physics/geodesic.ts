/**
 * Integrador de geodesicas nulas de Kerr-Newman en formulacion hamiltoniana.
 *
 * Es el espejo en CPU del integrador del shader: se usa para los tests de
 * validacion, para el trazador de orbitas y como referencia del test de paridad
 * GPU<->CPU. Cualquier cambio aqui debe replicarse en `render/shaders/kerr.glsl`.
 *
 * ---------------------------------------------------------------------------
 * Formulacion
 * ---------------------------------------------------------------------------
 * Con H = (1/2) g^{mu nu} p_mu p_nu y usando que la metrica no depende de t ni
 * de phi (p_t = -E y p_phi = L son constantes de movimiento), el hamiltoniano
 * se reduce a
 *
 *   2 Sigma H = Delta p_r^2 + p_theta^2 + F(r, theta)
 *   F = -U^2/Delta + w^2
 *   U = (r^2 + a^2) E - a L
 *   w = a E sin(theta) - L / sin(theta)
 *
 * (identidad verificada: sustituyendo p_r^2 = R/Delta^2 y p_theta^2 = Theta de
 * la separacion de Carter, 2 Sigma H se anula identicamente para fotones).
 *
 * El estado integrado es [t, r, theta, phi, p_r, p_theta]. Se elige esta forma
 * de segundo orden en lugar de la separada con raices +-sqrt(R), +-sqrt(Theta)
 * para no tener que gestionar los cambios de signo en los puntos de retorno,
 * que son la fuente clasica de artefactos en este tipo de trazador.
 *
 * Nota sobre el eje: los terminos 1/sin(theta) parecen singulares en los polos,
 * pero un rayo con L != 0 tiene siempre un punto de retorno en theta antes de
 * alcanzar el eje (Theta >= 0 lo impide), y para L = 0 esos terminos se anulan
 * identicamente. La singularidad es solo de coordenadas; se acota |sin(theta)|
 * por SIN_EPS por robustez numerica.
 */

import { delta, deltaPrime, sigma, type BHParams } from './kerrNewman'

const SIN_EPS = 1e-7

/** Estado de un rayo: [t, r, theta, phi, p_r, p_theta]. */
export type RayState = [number, number, number, number, number, number]

/** Constantes de movimiento de un rayo. */
export interface RayConstants {
  /** E = -p_t. */
  E: number
  /** L = p_phi. */
  L: number
}

// ---------------------------------------------------------------------------
// Lado derecho del sistema
// ---------------------------------------------------------------------------

/**
 * Devuelve d/dlambda [t, r, theta, phi, p_r, p_theta].
 *
 * Se conserva el termino completo -H * d_mu(Sigma)/Sigma en las ecuaciones de
 * los momentos (en vez de descartarlo asumiendo H = 0) para que el flujo
 * integrado sea el flujo hamiltoniano exacto. Eso hace que H se conserve hasta
 * el error del integrador, que es justo lo que mide `integrator.spec.ts`.
 */
export function nullGeodesicRHS(
  y: RayState,
  k: RayConstants,
  p: BHParams,
): RayState {
  const [, r, theta, , p_r, p_th] = y
  const { E, L } = k
  const a = p.a

  const sinT = Math.sin(theta)
  const cosT = Math.cos(theta)
  const s = Math.abs(sinT) < SIN_EPS ? (sinT < 0 ? -SIN_EPS : SIN_EPS) : sinT
  const s2 = s * s

  const Del = delta(r, p)
  const dDel = deltaPrime(r)
  const Sig = r * r + a * a * cosT * cosT
  const Sig_r = 2 * r
  const Sig_th = -2 * a * a * cosT * sinT

  const U = (r * r + a * a) * E - a * L
  const w = a * E * s - L / s

  // F y sus derivadas parciales
  const F = (-U * U) / Del + w * w
  const dF_dr = (-4 * r * E * U) / Del + (U * U * dDel) / (Del * Del)
  const w_th = cosT * (a * E + L / s2)
  const dF_dth = 2 * w * w_th
  const dF_dL = (2 * a * U) / Del - (2 * w) / s
  const dF_dE = (-2 * U * (r * r + a * a)) / Del + 2 * a * w * s

  // N = Delta p_r^2 + p_theta^2 + F,  H = N / (2 Sigma)
  const N = Del * p_r * p_r + p_th * p_th + F
  const H = N / (2 * Sig)
  const N_r = dDel * p_r * p_r + dF_dr
  const N_th = dF_dth

  return [
    // dt/dlambda = -dH/dE
    -dF_dE / (2 * Sig),
    // dr/dlambda = dH/dp_r
    (Del * p_r) / Sig,
    // dtheta/dlambda = dH/dp_theta
    p_th / Sig,
    // dphi/dlambda = dH/dL
    dF_dL / (2 * Sig),
    // dp_r/dlambda = -dH/dr
    -N_r / (2 * Sig) + (H * Sig_r) / Sig,
    // dp_theta/dlambda = -dH/dtheta
    -N_th / (2 * Sig) + (H * Sig_th) / Sig,
  ]
}

/** Valor del hamiltoniano. Debe ser 0 para geodesicas nulas. */
export function hamiltonian(y: RayState, k: RayConstants, p: BHParams): number {
  const [, r, theta, , p_r, p_th] = y
  const { E, L } = k
  const a = p.a
  const sinT = Math.sin(theta)
  const s = Math.abs(sinT) < SIN_EPS ? (sinT < 0 ? -SIN_EPS : SIN_EPS) : sinT
  const Del = delta(r, p)
  const Sig = sigma(r, theta, p)
  const U = (r * r + a * a) * E - a * L
  const w = a * E * s - L / s
  const F = (-U * U) / Del + w * w
  return (Del * p_r * p_r + p_th * p_th + F) / (2 * Sig)
}

/**
 * Constante de Carter Q = p_theta^2 - cos^2(theta) (a^2 E^2 - L^2/sin^2(theta)).
 * Es el tercer invariante que hace separable el movimiento; su deriva numerica
 * es un indicador independiente de la calidad del integrador.
 */
export function carterConstant(y: RayState, k: RayConstants, p: BHParams): number {
  const [, , theta, , , p_th] = y
  const { E, L } = k
  const sinT = Math.sin(theta)
  const s = Math.abs(sinT) < SIN_EPS ? (sinT < 0 ? -SIN_EPS : SIN_EPS) : sinT
  const cosT = Math.cos(theta)
  return p_th * p_th - cosT * cosT * (p.a * p.a * E * E - (L * L) / (s * s))
}

// ---------------------------------------------------------------------------
// Paso Runge-Kutta-Fehlberg 4(5), coeficientes de Cash-Karp
// ---------------------------------------------------------------------------

const B21 = 1 / 5
const B31 = 3 / 40, B32 = 9 / 40
const B41 = 3 / 10, B42 = -9 / 10, B43 = 6 / 5
const B51 = -11 / 54, B52 = 5 / 2, B53 = -70 / 27, B54 = 35 / 27
const B61 = 1631 / 55296, B62 = 175 / 512, B63 = 575 / 13824,
      B64 = 44275 / 110592, B65 = 253 / 4096
const C1 = 37 / 378, C3 = 250 / 621, C4 = 125 / 594, C6 = 512 / 1771
const D1 = 2825 / 27648, D3 = 18575 / 48384, D4 = 13525 / 55296,
      D5 = 277 / 14336, D6 = 1 / 4

type RHS = (y: RayState) => RayState

function axpy(y: RayState, h: number, ...terms: Array<[number, RayState]>): RayState {
  const out = [...y] as RayState
  for (const [c, k] of terms) {
    for (let i = 0; i < 6; i++) out[i] += h * c * k[i]
  }
  return out
}

/**
 * Suelo absoluto de la escala del error.
 *
 * El control de error PURAMENTE relativo falla para componentes identicamente
 * nulas. En una trayectoria ecuatorial p_theta = 0 exactamente: con un suelo
 * minusculo, su error de redondeo (~1e-16) se convierte en un error RELATIVO
 * enorme que domina la norma y limita el paso de forma permanente. Se observo
 * como un integrador que gastaba 300.000 pasos para avanzar tau = 4900 con paso
 * medio 0.016, mientras la deriva del hamiltoniano era de 1e-15: precision de
 * sobra, rendimiento inutilizable.
 *
 * Con este suelo, una componente nula solo exige |delta| <= tol * 1e-3, que el
 * redondeo cumple holgadamente, y las componentes de tamano normal (r, angulos,
 * momentos, todas O(0.1..100) en estos problemas) siguen bajo control relativo.
 */
const ERR_FLOOR = 1e-3

/** Un paso adaptativo. Devuelve el estado a 5o orden y el error estimado. */
export function cashKarpStep(
  y: RayState,
  h: number,
  f: RHS,
): { y5: RayState; err: number } {
  const k1 = f(y)
  const k2 = f(axpy(y, h, [B21, k1]))
  const k3 = f(axpy(y, h, [B31, k1], [B32, k2]))
  const k4 = f(axpy(y, h, [B41, k1], [B42, k2], [B43, k3]))
  const k5 = f(axpy(y, h, [B51, k1], [B52, k2], [B53, k3], [B54, k4]))
  const k6 = f(axpy(y, h, [B61, k1], [B62, k2], [B63, k3], [B64, k4], [B65, k5]))

  const y5 = axpy(y, h, [C1, k1], [C3, k3], [C4, k4], [C6, k6])
  const y4 = axpy(y, h, [D1, k1], [D3, k3], [D4, k4], [D5, k5], [D6, k6])

  // Error mixto absoluto/relativo sobre las componentes geometricas y de momento.
  // Se ignora t (componente 0): crece monotonamente y su escala no informa.
  let err = 0
  for (let i = 1; i < 6; i++) {
    const scale = Math.abs(y[i]) + Math.abs(y5[i]) + ERR_FLOOR
    err = Math.max(err, Math.abs(y5[i] - y4[i]) / scale)
  }
  return { y5, err }
}

// ---------------------------------------------------------------------------
// Trazado completo
// ---------------------------------------------------------------------------

export type RayOutcome = 'captured' | 'escaped' | 'maxSteps' | 'stopped'

export interface TraceOptions {
  /** Tolerancia relativa por paso del controlador adaptativo. */
  tol?: number
  /** Numero maximo de pasos aceptados. */
  maxSteps?: number
  /** Radio a partir del cual, alejandose, se considera escapado. */
  rEscape?: number
  /** Radio de captura (por defecto r_+ (1 + 1e-3)). */
  rCapture?: number
  /** Paso inicial. */
  h0?: number
  /** Guarda la trayectoria completa (para el trazador de orbitas). */
  recordPath?: boolean
  /** Uno de cada `pathStride` pasos se guarda cuando recordPath esta activo. */
  pathStride?: number
  /** Predicado extra de parada; si devuelve true el trazado termina con 'stopped'. */
  stop?: (y: RayState, prev: RayState) => boolean
}

export interface TraceResult {
  outcome: RayOutcome
  /** Estado final. */
  y: RayState
  /** Pasos aceptados. */
  steps: number
  /** Numero de rechazos del controlador de paso. */
  rejected: number
  /** Parametro afin recorrido. */
  lambda: number
  /** Direccion asintotica unitaria en pseudo-cartesianas si outcome = 'escaped'. */
  skyDir?: [number, number, number]
  /** Trayectoria muestreada si recordPath. */
  path?: RayState[]
  /** Deriva absoluta maxima del hamiltoniano observada. */
  maxHamiltonianDrift: number
  /** Deriva relativa maxima de la constante de Carter observada. */
  maxCarterDrift: number
}

export function traceNullGeodesic(
  y0: RayState,
  k: RayConstants,
  p: BHParams,
  opts: TraceOptions = {},
): TraceResult {
  const tol = opts.tol ?? 1e-9
  const maxSteps = opts.maxSteps ?? 100_000
  const rEscape = opts.rEscape ?? 1e4
  const disc = 1 - p.a * p.a - p.q * p.q
  const rPlus = disc >= 0 ? 1 + Math.sqrt(disc) : NaN
  const rCapture = opts.rCapture ?? (Number.isFinite(rPlus) ? rPlus * (1 + 1e-3) : 1e-3)
  const pathStride = opts.pathStride ?? 1

  const f: RHS = (s) => nullGeodesicRHS(s, k, p)

  let y = [...y0] as RayState
  let h = opts.h0 ?? 0.05
  let lambda = 0
  let steps = 0
  let rejected = 0
  let outcome: RayOutcome = 'maxSteps'

  const H0 = hamiltonian(y, k, p)
  const Q0 = carterConstant(y, k, p)
  let maxHDrift = 0
  let maxQDrift = 0

  const path: RayState[] | undefined = opts.recordPath ? [[...y] as RayState] : undefined

  while (steps < maxSteps) {
    // Limitar el paso para no saltar dentro del horizonte ni cruzar el eje.
    const distToCapture = y[1] - rCapture
    const hCap = Math.max(1e-9, 0.25 * distToCapture)
    if (h > hCap) h = hCap

    const { y5, err } = cashKarpStep(y, h, f)

    if (err > tol && h > 1e-12) {
      rejected++
      h *= Math.max(0.2, 0.9 * Math.pow(tol / err, 0.2))
      continue
    }

    const prev = y
    y = y5
    lambda += h
    steps++

    if (path && steps % pathStride === 0) path.push([...y] as RayState)

    maxHDrift = Math.max(maxHDrift, Math.abs(hamiltonian(y, k, p) - H0))
    if (Math.abs(Q0) > 1e-12) {
      maxQDrift = Math.max(maxQDrift, Math.abs(carterConstant(y, k, p) - Q0) / Math.abs(Q0))
    }

    if (opts.stop?.(y, prev)) {
      outcome = 'stopped'
      break
    }
    if (y[1] <= rCapture) {
      outcome = 'captured'
      break
    }
    const drdl = f(y)[1]
    if (y[1] >= rEscape && drdl > 0) {
      outcome = 'escaped'
      break
    }

    // Crecer el paso si el error lo permite.
    h *= Math.min(5, 0.9 * Math.pow(tol / Math.max(err, 1e-18), 0.2))
  }

  const result: TraceResult = {
    outcome,
    y,
    steps,
    rejected,
    lambda,
    maxHamiltonianDrift: maxHDrift,
    maxCarterDrift: maxQDrift,
  }
  if (path) result.path = path
  if (outcome === 'escaped') result.skyDir = asymptoticDirection(y, k, p)
  return result
}

/**
 * Direccion unitaria de la velocidad del rayo en pseudo-cartesianas
 * x = r sin(theta) cos(phi), y = r sin(theta) sin(phi), z = r cos(theta).
 */
export function velocityDirection(
  y: RayState,
  k: RayConstants,
  p: BHParams,
): [number, number, number] {
  const [, r, theta, phi] = y
  const d = nullGeodesicRHS(y, k, p)
  const dr = d[1]
  const dth = d[2]
  const dph = d[3]

  const st = Math.sin(theta)
  const ct = Math.cos(theta)
  const sp = Math.sin(phi)
  const cp = Math.cos(phi)

  // d/dlambda de (r sin t cos p, r sin t sin p, r cos t)
  const vx = dr * st * cp + r * ct * cp * dth - r * st * sp * dph
  const vy = dr * st * sp + r * ct * sp * dth + r * st * cp * dph
  const vz = dr * ct - r * st * dth

  const n = Math.hypot(vx, vy, vz)
  return [vx / n, vy / n, vz / n]
}

/**
 * Direccion asintotica del rayo, obtenida de la velocidad (no de la posicion):
 * a gran r el rayo se mueve casi radialmente y la direccion de la velocidad es
 * la posicion celeste de donde proviene la luz.
 */
export const asymptoticDirection = velocityDirection

/** Angulo entre dos direcciones unitarias, estable para angulos pequenos. */
export function angleBetween(
  u: readonly [number, number, number],
  v: readonly [number, number, number],
): number {
  const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
  const cx = u[1] * v[2] - u[2] * v[1]
  const cy = u[2] * v[0] - u[0] * v[2]
  const cz = u[0] * v[1] - u[1] * v[0]
  // atan2(|u x v|, u.v) no pierde precision cerca de 0 ni de pi, al contrario
  // que acos(u.v), que para angulos pequenos solo conserva la mitad de digitos.
  return Math.atan2(Math.hypot(cx, cy, cz), dot)
}

// ---------------------------------------------------------------------------
// Helpers de configuracion de rayos
// ---------------------------------------------------------------------------

/**
 * Construye un rayo ecuatorial entrante con parametro de impacto b = L/E,
 * partiendo de r0 en el plano ecuatorial. Se usa para medir la deflexion.
 *
 * p_r se obtiene de la condicion nula H = 0 tomando la rama entrante.
 */
export function equatorialInboundRay(
  r0: number,
  b: number,
  p: BHParams,
): { y: RayState; k: RayConstants } {
  const E = 1
  const L = b
  const a = p.a
  const Del = delta(r0, p)
  const U = (r0 * r0 + a * a) * E - a * L
  const w = a * E - L // sin(theta) = 1 en el ecuador
  // Delta p_r^2 + 0 + (-U^2/Delta + w^2) = 0
  const pr2 = (U * U / Del - w * w) / Del
  if (pr2 < 0) {
    throw new Error(`Parametro de impacto b=${b} inalcanzable desde r0=${r0}`)
  }
  return {
    y: [0, r0, Math.PI / 2, 0, -Math.sqrt(pr2), 0],
    k: { E, L },
  }
}

/**
 * Angulo de deflexion de un rayo ecuatorial con parametro de impacto b.
 * En campo debil debe tender a 4M/b (aqui 4/b, con M = 1).
 *
 * Se mide como el angulo entre la direccion de la velocidad al inicio y al final
 * del trazado, NO como |delta phi| - pi.
 *
 * La razon es importante: lanzando desde un r0 finito, |delta phi| - pi omite la
 * deflexion acumulada mas alla de r0. Para una recta con parametro de impacto b
 * el barrido total no es pi sino pi - 2 asin(b/r0), asi que |delta phi| - pi se
 * queda corto en 2b/r0. Con b = 1e4 y r0 = 1e9 eso son 2e-5 rad frente a una
 * deflexion de 4e-4: un error del 5%. Y no se arregla agrandando r0, porque
 * b^2/r0^2 se hunde bajo la precision de doble en el calculo de p_r.
 *
 * El angulo entre velocidades no sufre ese truncamiento: en r0 la velocidad ya
 * difiere de la asintotica solo en O(M/r0), aqui ~1e-9.
 */
export function deflectionAngle(b: number, p: BHParams, r0 = 1e7, tol = 1e-11): number {
  const { y, k } = equatorialInboundRay(r0, b, p)
  const dirIn = velocityDirection(y, k, p)
  const res = traceNullGeodesic(y, k, p, {
    tol,
    maxSteps: 2_000_000,
    rEscape: r0,
    h0: 1e-3 * r0,
  })
  if (res.outcome !== 'escaped') return NaN
  return angleBetween(dirIn, velocityDirection(res.y, k, p))
}
