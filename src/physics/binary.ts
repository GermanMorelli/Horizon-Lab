/**
 * Dos agujeros negros: datos iniciales de Brill-Lindquist.
 *
 * ---------------------------------------------------------------------------
 * QUE ES Y QUE NO ES
 * ---------------------------------------------------------------------------
 * No existe solucion exacta de las ecuaciones de Einstein para dos agujeros
 * negros: el problema de dos cuerpos en relatividad general no esta resuelto
 * analiticamente, y las simulaciones reales de fusiones son relatividad numerica
 * (ecuaciones de campo completas en una malla 3D, meses de supercomputador).
 *
 * Lo que si es exacto son los DATOS INICIALES de Brill-Lindquist: una solucion
 * exacta de las LIGADURAS de Einstein (la ligadura hamiltoniana con K_ij = 0)
 * para dos agujeros momentaneamente estaticos. Conformemente plana:
 *
 *   psi = 1 + m1/(2 r1) + m2/(2 r2)          r_i = |x - x_i|
 *   ds^2 = -alpha^2 dt^2 + psi^4 (dx^2 + dy^2 + dz^2)
 *   alpha = (2 - psi)/psi = 2/psi - 1
 *
 * El lapso NO lo fijan las ligaduras (es libertad de gauge); se toma la eleccion
 * que generaliza el caso de un solo agujero, y con ella el horizonte queda en
 * psi = 2 exactamente.
 *
 * Limites declarados:
 *  - Es una INSTANTANEA. No resuelve la evolucion, asi que una secuencia de
 *    instantaneas a separaciones decrecientes no es una fusion simulada: las
 *    posiciones las da la dinamica post-newtoniana de `pn.ts`, no Einstein.
 *  - m1 y m2 son masas "desnudas" (de puntura), no las masas de horizonte. La
 *    masa ADM total es exactamente m1 + m2; a separacion pequena las masas
 *    individuales de horizonte se desvian de m_i por la energia de interaccion.
 *  - Conformemente plana, luego sin espin ni momento: K_ij = 0. Los agujeros de
 *    este modo no giran (para espin hace falta Bowen-York, y con K_ij != 0 la
 *    geodesica necesita la evolucion completa).
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE MODULO SE PUEDE VALIDAR
 * ---------------------------------------------------------------------------
 * Con m2 = 0 la metrica es EXACTAMENTE Schwarzschild en coordenadas isotropas.
 * El integrador de aqui, escrito en cartesianas isotropas y sin ninguna simetria
 * axial que explotar, debe reproducir los mismos invariantes que el de
 * Boyer-Lindquist: sombra en sqrt(27) M, deflexion 4M/b. Son dos caminos de
 * coordenadas completamente distintos hacia el mismo numero.
 */

export interface Puncture {
  /** Masa desnuda (de puntura), en unidades de la masa ADM total. */
  m: number
  /** Posicion en coordenadas isotropas cartesianas. */
  pos: [number, number, number]
}

/** Estado de un rayo: posicion y momento covariante espacial. */
export interface BinaryRay {
  x: [number, number, number]
  p: [number, number, number]
  /** E = -p_t, constante de movimiento (la metrica es estatica). */
  E: number
}

/** Valor de psi en el horizonte del gauge: alpha = 0 exactamente. */
export const PSI_HORIZON = 2

/**
 * Lapso al que se declara capturado el rayo, ligeramente por encima de 0.
 *
 * NO se termina en alpha = 0 (psi = 2) porque el lado derecho contiene un termino
 * E^2 d_i(alpha)/alpha^3 que diverge al acercarse: el controlador de paso
 * adaptativo lo detecta como error creciente, encoge h sin fondo y la integracion
 * se estanca. Se observo como rayos que agotaban 400.000 pasos sin llegar a
 * capturarse, y una biseccion que daba 4.65 en lugar de sqrt(27) porque contaba
 * esos rayos como escapados.
 *
 * Terminar en alpha = 0.05 es fisicamente inocuo: corresponde a psi ~ 1.905,
 * mientras que la esfera de fotones esta en psi ~ 1.27. Un rayo que llega ahi ya
 * esta muy dentro de la esfera de fotones y su captura es inevitable.
 */
export const ALPHA_CAPTURE = 0.05

// ---------------------------------------------------------------------------
// Factor conforme y lapso
// ---------------------------------------------------------------------------

/** psi = 1 + sum m_i/(2 r_i). */
export function conformalFactor(
  x: readonly [number, number, number],
  punctures: readonly Puncture[],
): number {
  let psi = 1
  for (const p of punctures) {
    const dx = x[0] - p.pos[0]
    const dy = x[1] - p.pos[1]
    const dz = x[2] - p.pos[2]
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz)
    psi += p.m / (2 * Math.max(r, 1e-9))
  }
  return psi
}

/** Gradiente de psi. Apunta hacia las masas, ya que psi crece al acercarse. */
export function conformalGradient(
  x: readonly [number, number, number],
  punctures: readonly Puncture[],
): [number, number, number] {
  let gx = 0
  let gy = 0
  let gz = 0
  for (const p of punctures) {
    const dx = x[0] - p.pos[0]
    const dy = x[1] - p.pos[1]
    const dz = x[2] - p.pos[2]
    const r2 = dx * dx + dy * dy + dz * dz
    const r = Math.sqrt(Math.max(r2, 1e-18))
    // d/dx_i [ m/(2r) ] = -m x_i / (2 r^3)
    const k = -p.m / (2 * r * r * r)
    gx += k * dx
    gy += k * dy
    gz += k * dz
  }
  return [gx, gy, gz]
}

/**
 * Lapso alpha = 2/psi - 1.
 * Vale 1 en el infinito, 0 en psi = 2 (el horizonte) y es negativo dentro.
 */
export function lapse(psi: number): number {
  return 2 / psi - 1
}

/** Gradiente del lapso: d alpha = -2 d psi / psi^2. */
export function lapseGradient(
  psi: number,
  gradPsi: readonly [number, number, number],
): [number, number, number] {
  const k = -2 / (psi * psi)
  return [k * gradPsi[0], k * gradPsi[1], k * gradPsi[2]]
}

// ---------------------------------------------------------------------------
// Geodesicas nulas
// ---------------------------------------------------------------------------

/**
 * Hamiltoniano H = (1/2) g^{mu nu} p_mu p_nu = (1/2)[ -E^2/alpha^2 + |p|^2/psi^4 ].
 * Debe valer 0 para fotones.
 */
export function binaryHamiltonian(ray: BinaryRay, punctures: readonly Puncture[]): number {
  const psi = conformalFactor(ray.x, punctures)
  const a = lapse(psi)
  const p2 = ray.p[0] ** 2 + ray.p[1] ** 2 + ray.p[2] ** 2
  const psi4 = psi * psi * psi * psi
  return 0.5 * (-(ray.E * ray.E) / (a * a) + p2 / psi4)
}

/**
 * Lado derecho del sistema.
 *
 *   dx^i/dlambda = p_i / psi^4
 *   dp_i/dlambda = -E^2 d_i(alpha) / alpha^3 + 2 |p|^2 d_i(psi) / psi^5
 *
 * Sustituyendo d_i(alpha) = -2 d_i(psi)/psi^2, los dos terminos quedan
 * proporcionales a d_i(psi), que apunta hacia las masas: de ahi la atraccion.
 */
export function binaryRHS(
  ray: BinaryRay,
  punctures: readonly Puncture[],
): { dx: [number, number, number]; dp: [number, number, number] } {
  const psi = conformalFactor(ray.x, punctures)
  const gradPsi = conformalGradient(ray.x, punctures)
  const a = lapse(psi)
  const gradA = lapseGradient(psi, gradPsi)

  const psi4 = psi * psi * psi * psi
  const psi5 = psi4 * psi
  const p2 = ray.p[0] ** 2 + ray.p[1] ** 2 + ray.p[2] ** 2
  const a3 = a * a * a
  const E2 = ray.E * ray.E

  const dx: [number, number, number] = [
    ray.p[0] / psi4,
    ray.p[1] / psi4,
    ray.p[2] / psi4,
  ]
  const dp: [number, number, number] = [
    (-E2 * gradA[0]) / a3 + (2 * p2 * gradPsi[0]) / psi5,
    (-E2 * gradA[1]) / a3 + (2 * p2 * gradPsi[1]) / psi5,
    (-E2 * gradA[2]) / a3 + (2 * p2 * gradPsi[2]) / psi5,
  ]
  return { dx, dp }
}

/**
 * Construye un foton en `x` con direccion unitaria `dir` en el marco ortonormal
 * del observador estatico, con energia local unidad.
 *
 * La tetrada es e_0 = (1/alpha) d_t, e_i = (1/psi^2) d_i, de donde
 *   E = alpha(x),   p_i = psi(x)^2 dir_i
 * y se comprueba de inmediato que el momento es nulo:
 *   -E^2/alpha^2 + |p|^2/psi^4 = -1 + |dir|^2 = 0.
 */
export function binaryPhotonFrom(
  x: readonly [number, number, number],
  dir: readonly [number, number, number],
  punctures: readonly Puncture[],
): BinaryRay {
  const psi = conformalFactor(x, punctures)
  const a = lapse(psi)
  const psi2 = psi * psi
  const n = Math.hypot(dir[0], dir[1], dir[2]) || 1
  return {
    x: [x[0], x[1], x[2]],
    p: [(psi2 * dir[0]) / n, (psi2 * dir[1]) / n, (psi2 * dir[2]) / n],
    E: a,
  }
}

export type BinaryOutcome = 'captured' | 'escaped' | 'maxSteps'

export interface BinaryTraceOptions {
  tol?: number
  maxSteps?: number
  /** Radio (desde el origen) a partir del cual se considera escapado. */
  rEscape?: number
  h0?: number
  recordPath?: boolean
  pathStride?: number
  /** Lapso al que se declara la captura; ver ALPHA_CAPTURE. */
  alphaCapture?: number
}

export interface BinaryTraceResult {
  outcome: BinaryOutcome
  ray: BinaryRay
  steps: number
  /** Direccion asintotica si escapa: la del momento, ya que psi -> 1. */
  skyDir?: [number, number, number]
  /** Cual de las punturas capturo el rayo. */
  capturedBy?: number
  path?: Array<[number, number, number]>
  maxHamiltonianDrift: number
}

/** Coeficientes de Cash-Karp, iguales a los del trazador de Kerr-Newman. */
const CK = {
  b21: 1 / 5,
  b31: 3 / 40, b32: 9 / 40,
  b41: 3 / 10, b42: -9 / 10, b43: 6 / 5,
  b51: -11 / 54, b52: 5 / 2, b53: -70 / 27, b54: 35 / 27,
  b61: 1631 / 55296, b62: 175 / 512, b63: 575 / 13824,
  b64: 44275 / 110592, b65: 253 / 4096,
  c1: 37 / 378, c3: 250 / 621, c4: 125 / 594, c6: 512 / 1771,
  d1: 2825 / 27648, d3: 18575 / 48384, d4: 13525 / 55296,
  d5: 277 / 14336, d6: 1 / 4,
}

/** Suelo absoluto de la escala del error; ver la nota en geodesic.ts. */
const ERR_FLOOR = 1e-3

type Deriv = { dx: [number, number, number]; dp: [number, number, number] }

function addScaled(
  ray: BinaryRay,
  h: number,
  terms: Array<[number, Deriv]>,
): BinaryRay {
  const x: [number, number, number] = [ray.x[0], ray.x[1], ray.x[2]]
  const p: [number, number, number] = [ray.p[0], ray.p[1], ray.p[2]]
  for (const [c, k] of terms) {
    for (let i = 0; i < 3; i++) {
      x[i] += h * c * k.dx[i]
      p[i] += h * c * k.dp[i]
    }
  }
  return { x, p, E: ray.E }
}

/**
 * Traza una geodesica nula. La metrica es estatica, asi que E se conserva, pero
 * NO hay simetria axial con dos punturas: no existe un analogo de L y hay que
 * integrar las tres componentes del momento.
 */
export function traceBinaryRay(
  init: BinaryRay,
  punctures: readonly Puncture[],
  opts: BinaryTraceOptions = {},
): BinaryTraceResult {
  const tol = opts.tol ?? 1e-9
  const maxSteps = opts.maxSteps ?? 100_000
  const rEscape = opts.rEscape ?? 1e4
  const pathStride = opts.pathStride ?? 1

  const f = (r: BinaryRay) => binaryRHS(r, punctures)
  let ray: BinaryRay = { x: [...init.x] as [number, number, number], p: [...init.p] as [number, number, number], E: init.E }
  let h = opts.h0 ?? 0.05
  let steps = 0
  let outcome: BinaryOutcome = 'maxSteps'
  let capturedBy: number | undefined
  const H0 = binaryHamiltonian(ray, punctures)
  let maxDrift = 0
  const path: Array<[number, number, number]> | undefined = opts.recordPath
    ? [[...ray.x] as [number, number, number]]
    : undefined

  while (steps < maxSteps) {
    // Limitar el paso por la distancia a la puntura mas cercana: es donde la
    // curvatura crece sin cota y donde el paso debe encogerse.
    let dMin = Infinity
    for (const pc of punctures) {
      const d = Math.hypot(
        ray.x[0] - pc.pos[0],
        ray.x[1] - pc.pos[1],
        ray.x[2] - pc.pos[2],
      )
      if (d < dMin) dMin = d
    }
    const hCap = Math.max(1e-9, 0.2 * dMin)
    if (h > hCap) h = hCap

    const k1 = f(ray)
    const k2 = f(addScaled(ray, h, [[CK.b21, k1]]))
    const k3 = f(addScaled(ray, h, [[CK.b31, k1], [CK.b32, k2]]))
    const k4 = f(addScaled(ray, h, [[CK.b41, k1], [CK.b42, k2], [CK.b43, k3]]))
    const k5 = f(addScaled(ray, h, [[CK.b51, k1], [CK.b52, k2], [CK.b53, k3], [CK.b54, k4]]))
    const k6 = f(
      addScaled(ray, h, [
        [CK.b61, k1], [CK.b62, k2], [CK.b63, k3], [CK.b64, k4], [CK.b65, k5],
      ]),
    )

    const y5 = addScaled(ray, h, [[CK.c1, k1], [CK.c3, k3], [CK.c4, k4], [CK.c6, k6]])
    const y4 = addScaled(ray, h, [
      [CK.d1, k1], [CK.d3, k3], [CK.d4, k4], [CK.d5, k5], [CK.d6, k6],
    ])

    let err = 0
    for (let i = 0; i < 3; i++) {
      const sx = Math.abs(ray.x[i]) + Math.abs(y5.x[i]) + ERR_FLOOR
      const sp = Math.abs(ray.p[i]) + Math.abs(y5.p[i]) + ERR_FLOOR
      err = Math.max(err, Math.abs(y5.x[i] - y4.x[i]) / sx, Math.abs(y5.p[i] - y4.p[i]) / sp)
    }

    if (err > tol && h > 1e-12) {
      h *= Math.max(0.2, 0.9 * Math.pow(tol / err, 0.2))
      continue
    }

    ray = y5
    steps++
    if (path && steps % pathStride === 0) path.push([...ray.x] as [number, number, number])

    maxDrift = Math.max(maxDrift, Math.abs(binaryHamiltonian(ray, punctures) - H0))

    // Captura: alpha por debajo del umbral (ver ALPHA_CAPTURE).
    const psi = conformalFactor(ray.x, punctures)
    if (lapse(psi) <= (opts.alphaCapture ?? ALPHA_CAPTURE)) {
      outcome = 'captured'
      // Atribuir la captura a la puntura mas cercana.
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < punctures.length; i++) {
        const d = Math.hypot(
          ray.x[0] - punctures[i].pos[0],
          ray.x[1] - punctures[i].pos[1],
          ray.x[2] - punctures[i].pos[2],
        )
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      capturedBy = best
      break
    }

    const rNow = Math.hypot(ray.x[0], ray.x[1], ray.x[2])
    if (rNow >= rEscape) {
      const d = f(ray)
      const outward = ray.x[0] * d.dx[0] + ray.x[1] * d.dx[1] + ray.x[2] * d.dx[2]
      if (outward > 0) {
        outcome = 'escaped'
        break
      }
    }

    h *= Math.min(5, 0.9 * Math.pow(tol / Math.max(err, 1e-18), 0.2))
  }

  const result: BinaryTraceResult = {
    outcome,
    ray,
    steps,
    maxHamiltonianDrift: maxDrift,
  }
  if (capturedBy !== undefined) result.capturedBy = capturedBy
  if (path) result.path = path
  if (outcome === 'escaped') {
    // A gran distancia psi -> 1, asi que la direccion de la velocidad coincide
    // con la del momento covariante.
    const n = Math.hypot(ray.p[0], ray.p[1], ray.p[2]) || 1
    result.skyDir = [ray.p[0] / n, ray.p[1] / n, ray.p[2] / n]
  }
  return result
}

// ---------------------------------------------------------------------------
// Conversiones y observables
// ---------------------------------------------------------------------------

/**
 * Radio isotropo del horizonte de un agujero aislado de masa m: r_iso = m/2.
 * (En Schwarzschild seria r = 2m; la relacion es r_schw = r_iso (1 + m/2r_iso)^2.)
 */
export function isotropicHorizonRadius(m: number): number {
  return m / 2
}

/** r_schw = r_iso (1 + m/(2 r_iso))^2, para un agujero aislado. */
export function isotropicToSchwarzschild(rIso: number, m: number): number {
  const psi = 1 + m / (2 * rIso)
  return rIso * psi * psi
}

/**
 * Radio isotropo de la esfera de fotones de un agujero aislado.
 * De r_schw = 3m con u = m/(2 r_iso) sale u^2 - 4u + 1 = 0, cuya raiz exterior es
 * u = 2 - sqrt(3), es decir r_iso = m / (2(2 - sqrt(3))) ~ 1.866 m.
 */
export function isotropicPhotonSphere(m: number): number {
  return m / (2 * (2 - Math.sqrt(3)))
}

/**
 * Masa ADM total. Para Brill-Lindquist es exactamente la suma de las masas de
 * puntura, con independencia de la separacion.
 */
export function admMass(punctures: readonly Puncture[]): number {
  let s = 0
  for (const p of punctures) s += p.m
  return s
}

/**
 * Distancia propia entre las dos punturas a lo largo de la recta coordenada que
 * las une, integrando el elemento de linea psi^2 dl.
 *
 * Es bastante mayor que la separacion coordenada: es una de las formas de ver que
 * las coordenadas isotropas no miden distancias directamente. La integral diverge
 * en las punturas, asi que se recorta en sus horizontes (psi = 2).
 */
export function properSeparation(
  punctures: readonly Puncture[],
  samples = 4000,
): number {
  if (punctures.length < 2) return 0
  const [a, b] = punctures
  const dx = [b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]]
  const len = Math.hypot(dx[0], dx[1], dx[2])
  if (len === 0) return 0

  // Recorte en los horizontes coordenados de cada puntura.
  const t0 = Math.min(0.45, isotropicHorizonRadius(a.m) / len)
  const t1 = Math.max(0.55, 1 - isotropicHorizonRadius(b.m) / len)

  let sum = 0
  const dt = (t1 - t0) / samples
  for (let i = 0; i < samples; i++) {
    // Regla del punto medio.
    const t = t0 + (i + 0.5) * dt
    const x: [number, number, number] = [
      a.pos[0] + t * dx[0],
      a.pos[1] + t * dx[1],
      a.pos[2] + t * dx[2],
    ]
    const psi = conformalFactor(x, punctures)
    sum += psi * psi * dt * len
  }
  return sum
}
