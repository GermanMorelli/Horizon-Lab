/**
 * Metrica de Kerr-Newman en coordenadas de Boyer-Lindquist, unidades
 * geometrizadas G = c = M = 1. Los parametros son los adimensionales
 *   a = J / M^2   (espin, negativo = retrogrado)
 *   q = Q / M     (carga)
 * con la condicion de existencia de horizonte a^2 + q^2 <= 1.
 *
 * Elemento de linea:
 *   ds^2 = -(Delta - a^2 sin^2 t)/Sigma dt^2
 *          - 2 a sin^2 t (r^2 + a^2 - Delta)/Sigma dt dphi
 *          + Sigma/Delta dr^2 + Sigma dtheta^2
 *          + A sin^2 t /Sigma dphi^2
 *
 * Este modulo es la unica fuente de verdad de la geometria en CPU: alimenta el
 * HUD, el trazador de orbitas y los tests. El shader replica estas mismas
 * expresiones en GLSL y `tests/shaderParity.spec.ts` verifica que coincidan.
 */

import { goldenMin, scanRoot } from './rootfind'

export interface BHParams {
  /** a = J/M^2, en [-0.998, 0.998] por el limite de Thorne (signo = sentido). */
  a: number
  /** q = Q/M, en [0, 1]. */
  q: number
}

// ---------------------------------------------------------------------------
// Funciones basicas de la metrica
// ---------------------------------------------------------------------------

/** Delta(r) = r^2 - 2r + a^2 + q^2. Se anula en los horizontes. */
export function delta(r: number, p: BHParams): number {
  return r * r - 2 * r + p.a * p.a + p.q * p.q
}

/** dDelta/dr = 2(r - 1). */
export function deltaPrime(r: number): number {
  return 2 * (r - 1)
}

/** Sigma(r, theta) = r^2 + a^2 cos^2(theta). */
export function sigma(r: number, theta: number, p: BHParams): number {
  const c = Math.cos(theta)
  return r * r + p.a * p.a * c * c
}

/** A(r, theta) = (r^2 + a^2)^2 - a^2 Delta sin^2(theta). */
export function bigA(r: number, theta: number, p: BHParams): number {
  const s = Math.sin(theta)
  const r2a2 = r * r + p.a * p.a
  return r2a2 * r2a2 - p.a * p.a * delta(r, p) * s * s
}

// ---------------------------------------------------------------------------
// Superficies caracteristicas
// ---------------------------------------------------------------------------

export interface Horizons {
  /** Horizonte de sucesos exterior. NaN si es singularidad desnuda. */
  rPlus: number
  /** Horizonte de Cauchy interior. NaN si es singularidad desnuda. */
  rMinus: number
  /** false cuando a^2 + q^2 > 1: no hay horizonte (singularidad desnuda). */
  hasHorizon: boolean
  /** true en el caso extremo a^2 + q^2 = 1 (horizontes degenerados). */
  isExtremal: boolean
}

/** r_pm = 1 +- sqrt(1 - a^2 - q^2). */
export function horizons(p: BHParams): Horizons {
  const disc = 1 - p.a * p.a - p.q * p.q
  if (disc < 0) {
    return { rPlus: NaN, rMinus: NaN, hasHorizon: false, isExtremal: false }
  }
  const root = Math.sqrt(disc)
  return {
    rPlus: 1 + root,
    rMinus: 1 - root,
    hasHorizon: true,
    isExtremal: disc < 1e-12,
  }
}

/**
 * Radio de la ergosuperficie exterior: solucion de g_tt = 0, es decir
 *   r_E(theta) = 1 + sqrt(1 - q^2 - a^2 cos^2(theta)).
 * En el ecuador vale 2 para Kerr puro; en los polos coincide con r_+.
 */
export function ergosphereRadius(theta: number, p: BHParams): number {
  const c = Math.cos(theta)
  const disc = 1 - p.q * p.q - p.a * p.a * c * c
  return disc < 0 ? NaN : 1 + Math.sqrt(disc)
}

/**
 * Gravedad superficial kappa = (r_+ - r_-) / (2 (r_+^2 + a^2)), en unidades 1/M.
 * Vale 1/4 para Schwarzschild y 0 en el caso extremo.
 */
export function surfaceGravity(p: BHParams): number {
  const h = horizons(p)
  if (!h.hasHorizon) return NaN
  return (h.rPlus - h.rMinus) / (2 * (h.rPlus * h.rPlus + p.a * p.a))
}

/** Area del horizonte exterior, A_H = 4 pi (r_+^2 + a^2), en unidades M^2. */
export function horizonArea(p: BHParams): number {
  const h = horizons(p)
  if (!h.hasHorizon) return NaN
  return 4 * Math.PI * (h.rPlus * h.rPlus + p.a * p.a)
}

/** Entropia de Bekenstein-Hawking en unidades de k_B: S = A_H / 4 (l_P^2 aparte). */
export function horizonEntropyGeom(p: BHParams): number {
  return horizonArea(p) / 4
}

// ---------------------------------------------------------------------------
// Metrica covariante e inversa
// ---------------------------------------------------------------------------

export interface MetricComponents {
  g_tt: number
  g_tphi: number
  g_phiphi: number
  g_rr: number
  g_thth: number
}

/**
 * Componentes covariantes no nulas.
 * Se usa la identidad Sigma - 2r + q^2 = Delta - a^2 sin^2(theta) para escribir
 * g_tt sin cancelaciones catastroficas, y r^2 + a^2 - Delta = 2r - q^2 para g_tphi.
 */
export function metric(r: number, theta: number, p: BHParams): MetricComponents {
  const s = Math.sin(theta)
  const s2 = s * s
  const Sig = sigma(r, theta, p)
  const Del = delta(r, p)
  const A = bigA(r, theta, p)
  const a = p.a
  return {
    g_tt: -(Del - a * a * s2) / Sig,
    g_tphi: (-a * s2 * (r * r + a * a - Del)) / Sig,
    g_phiphi: (A * s2) / Sig,
    g_rr: Sig / Del,
    g_thth: Sig,
  }
}

export interface InverseMetric {
  gtt: number
  gtphi: number
  gphiphi: number
  grr: number
  gthth: number
}

/**
 * Componentes contravariantes. Se derivan invirtiendo el bloque (t, phi), cuyo
 * determinante es exactamente -Delta sin^2(theta) (identidad
 * (Delta - a^2 s)A + a^2 s (r^2+a^2-Delta)^2 = Delta Sigma^2).
 */
export function inverseMetric(r: number, theta: number, p: BHParams): InverseMetric {
  const s = Math.sin(theta)
  const s2 = s * s
  const Sig = sigma(r, theta, p)
  const Del = delta(r, p)
  const A = bigA(r, theta, p)
  const a = p.a
  return {
    gtt: -A / (Sig * Del),
    gtphi: (-a * (r * r + a * a - Del)) / (Sig * Del),
    gphiphi: (Del - a * a * s2) / (Sig * Del * s2),
    grr: Del / Sig,
    gthth: 1 / Sig,
  }
}

// ---------------------------------------------------------------------------
// Observador ZAMO (locally non-rotating frame)
// ---------------------------------------------------------------------------

/**
 * Velocidad angular de arrastre de marcos:
 *   omega = -g_tphi / g_phiphi = a (r^2 + a^2 - Delta) / A.
 * Para Kerr se reduce a 2 a r / A.
 */
export function frameDraggingOmega(r: number, theta: number, p: BHParams): number {
  return (p.a * (r * r + p.a * p.a - delta(r, p))) / bigA(r, theta, p)
}

/**
 * Factor de lapso del ZAMO: alpha = sqrt(Delta Sigma / A) = dtau/dt.
 * Es la dilatacion temporal gravitacional del observador; vale
 * sqrt(1 - 2/r) en el limite de Schwarzschild y 0 en el horizonte.
 */
export function zamoLapse(r: number, theta: number, p: BHParams): number {
  const v = (delta(r, p) * sigma(r, theta, p)) / bigA(r, theta, p)
  return v <= 0 ? 0 : Math.sqrt(v)
}

/**
 * Tetrada ortonormal del ZAMO, como cuatro vectores en la base coordenada
 * (componentes contravariantes e_a^mu con mu = t, r, theta, phi).
 *
 * Es la base en la que se define la direccion de cada pixel: convertir la
 * direccion local a p_mu con esta tetrada incorpora automaticamente la
 * aberracion relativista y el arrastre de marcos.
 */
export interface Tetrad {
  /** e_0 (temporal, = 4-velocidad del ZAMO). */
  e0: [number, number, number, number]
  /** e_r (radial). */
  er: [number, number, number, number]
  /** e_theta (polar). */
  eth: [number, number, number, number]
  /** e_phi (azimutal). */
  ephi: [number, number, number, number]
}

export function zamoTetrad(r: number, theta: number, p: BHParams): Tetrad {
  const s = Math.max(Math.abs(Math.sin(theta)), 1e-9)
  const Sig = sigma(r, theta, p)
  const Del = delta(r, p)
  const A = bigA(r, theta, p)
  const omega = frameDraggingOmega(r, theta, p)
  const N = Math.sqrt(A / (Del * Sig)) // = 1 / alpha

  return {
    e0: [N, 0, 0, N * omega],
    er: [0, Math.sqrt(Del / Sig), 0, 0],
    eth: [0, 0, 1 / Math.sqrt(Sig), 0],
    ephi: [0, 0, 0, Math.sqrt(Sig) / (Math.sqrt(A) * s)],
  }
}

/**
 * Convierte una direccion unitaria en el cielo local del ZAMO
 * (componentes d_r, d_theta, d_phi en la tetrada) al momento covariante p_mu
 * de un foton con energia local unidad.
 *
 * Devuelve [p_t, p_r, p_theta, p_phi]; de ahi E = -p_t y L = p_phi son
 * constantes de movimiento.
 */
export function photonMomentumFromDirection(
  r: number,
  theta: number,
  dir: [number, number, number],
  p: BHParams,
): [number, number, number, number] {
  const t = zamoTetrad(r, theta, p)
  const [dr, dth, dph] = dir

  // p^mu = e_0^mu + d_r e_r^mu + d_theta e_theta^mu + d_phi e_phi^mu
  const pt_up = t.e0[0]
  const pr_up = dr * t.er[1]
  const pth_up = dth * t.eth[2]
  const pph_up = t.e0[3] + dph * t.ephi[3]

  const g = metric(r, theta, p)
  return [
    g.g_tt * pt_up + g.g_tphi * pph_up,
    g.g_rr * pr_up,
    g.g_thth * pth_up,
    g.g_tphi * pt_up + g.g_phiphi * pph_up,
  ]
}

// ---------------------------------------------------------------------------
// Orbitas circulares ecuatoriales
// ---------------------------------------------------------------------------

/** Derivadas radiales de la metrica en el ecuador (theta = pi/2). */
function equatorialMetricDerivs(r: number, p: BHParams) {
  const a = p.a
  const q2 = p.q * p.q
  const r2 = r * r
  const r3 = r2 * r
  // g_tt = -(1 - 2/r + q^2/r^2)
  const dg_tt = -2 / r2 + (2 * q2) / r3
  // g_tphi = -a (2r - q^2)/r^2  =>  d/dr = -a * d/dr(2/r - q^2/r^2)
  const dg_tphi = -a * dg_tt
  // g_phiphi = r^2 + a^2 + 2 a^2/r - a^2 q^2/r^2
  const dg_phiphi = 2 * r - (2 * a * a) / r2 + (2 * a * a * q2) / r3
  return { dg_tt, dg_tphi, dg_phiphi }
}

/**
 * Velocidad angular Omega = dphi/dt de una orbita circular ecuatorial.
 * Sale de la condicion geodesica radial
 *   d_r g_tt + 2 Omega d_r g_tphi + Omega^2 d_r g_phiphi = 0.
 *
 * Para Kerr se reduce a la formula conocida Omega = 1/(r^{3/2} + a).
 * `prograde = false` toma la rama contrarrotante.
 */
export function circularOmega(r: number, p: BHParams, prograde = true): number {
  const { dg_tt, dg_tphi, dg_phiphi } = equatorialMetricDerivs(r, p)
  const disc = dg_tphi * dg_tphi - dg_tt * dg_phiphi
  if (disc < 0) return NaN
  const sign = prograde ? 1 : -1
  return (-dg_tphi + sign * Math.sqrt(disc)) / dg_phiphi
}

/**
 * Norma al cuadrado de u^mu ~ (1, 0, 0, Omega): g_tt + 2 Omega g_tphi + Omega^2 g_phiphi.
 * Es negativa donde la orbita circular es temporal (existe una particula que la
 * recorre) y se anula exactamente en la orbita circular de fotones.
 */
export function circularNormSquared(r: number, p: BHParams, prograde = true): number {
  const Om = circularOmega(r, p, prograde)
  const g = metric(r, Math.PI / 2, p)
  return g.g_tt + 2 * Om * g.g_tphi + Om * Om * g.g_phiphi
}

/**
 * Radio de la orbita circular de fotones en el ecuador (esfera de fotones):
 * la raiz exterior de `circularNormSquared`.
 *
 * Valores de referencia: 3 (Schwarzschild), 1 (Kerr extremal prograda),
 * 4 (Kerr extremal retrograda), 2 (Reissner-Nordstrom extremal).
 */
export function photonCircularRadius(p: BHParams, prograde = true): number {
  const h = horizons(p)
  const lo = h.hasHorizon ? h.rPlus + 1e-9 : 1e-6
  return scanRoot((r) => circularNormSquared(r, p, prograde), lo, 12, 4096, true)
}

/** Energia especifica E/mu de la orbita circular ecuatorial en r. */
export function circularEnergy(r: number, p: BHParams, prograde = true): number {
  const Om = circularOmega(r, p, prograde)
  const g = metric(r, Math.PI / 2, p)
  const norm = g.g_tt + 2 * Om * g.g_tphi + Om * Om * g.g_phiphi
  if (norm >= 0) return NaN // sin orbita temporal
  const ut = 1 / Math.sqrt(-norm)
  return -ut * (g.g_tt + Om * g.g_tphi)
}

/** Momento angular especifico L/mu de la orbita circular ecuatorial en r. */
export function circularAngularMomentum(r: number, p: BHParams, prograde = true): number {
  const Om = circularOmega(r, p, prograde)
  const g = metric(r, Math.PI / 2, p)
  const norm = g.g_tt + 2 * Om * g.g_tphi + Om * Om * g.g_phiphi
  if (norm >= 0) return NaN
  const ut = 1 / Math.sqrt(-norm)
  return ut * (g.g_tphi + Om * g.g_phiphi)
}

/** Factor de Lorentz temporal u^t de la orbita circular ecuatorial en r. */
export function circularUt(r: number, p: BHParams, prograde = true): number {
  const Om = circularOmega(r, p, prograde)
  const g = metric(r, Math.PI / 2, p)
  const norm = g.g_tt + 2 * Om * g.g_tphi + Om * Om * g.g_phiphi
  if (norm >= 0) return NaN
  return 1 / Math.sqrt(-norm)
}

/**
 * ISCO: ultima orbita circular estable. Es el minimo de E(r) sobre las orbitas
 * circulares, buscado por seccion dorada entre la orbita de fotones y r = 60.
 *
 * Para Kerr existe forma cerrada (`iscoKerrAnalytic`) y el test de validacion
 * compara ambas. Para Kerr-Newman (q != 0) no la hay, y esta es la via correcta.
 */
export function iscoRadius(p: BHParams, prograde = true): number {
  const rPh = photonCircularRadius(p, prograde)
  if (!Number.isFinite(rPh)) return NaN
  const lo = rPh * (1 + 1e-6) + 1e-9
  const hi = 60
  const r = goldenMin((x) => {
    const e = circularEnergy(x, p, prograde)
    return Number.isFinite(e) ? e : 1e9
  }, lo, hi, 1e-12)
  return r
}

/**
 * ISCO de Kerr en forma cerrada (Bardeen, Press & Teukolsky 1972).
 * Solo valida para q = 0; se usa como referencia en los tests.
 */
export function iscoKerrAnalytic(a: number, prograde = true): number {
  const abs = Math.abs(a)
  const signedA = prograde ? abs : -abs
  const z1 =
    1 + Math.cbrt(1 - abs * abs) * (Math.cbrt(1 + abs) + Math.cbrt(1 - abs))
  const z2 = Math.sqrt(3 * abs * abs + z1 * z1)
  const branch = Math.sqrt((3 - z1) * (3 + z1 + 2 * z2))
  return 3 + z2 - Math.sign(signedA || 1) * branch
}

/**
 * Esfera de fotones de Reissner-Nordstrom en forma cerrada:
 * raiz exterior de r^2 - 3r + 2q^2 = 0. Referencia para los tests.
 */
export function photonSphereRNAnalytic(q: number): number {
  return (3 + Math.sqrt(9 - 8 * q * q)) / 2
}

/**
 * Factor de corrimiento total g = nu_obs / nu_emit para un foton de constantes
 * (E, L) emitido desde el plano ecuatorial en r por materia en orbita circular,
 * y recibido por una camara cuya energia local del foton es 1.
 *
 *   g = (p.u)_camara / (p.u)_disco = 1 / [u^t (E - Omega L)]
 *
 * Un solo factor engloba el Doppler relativista y el corrimiento gravitacional.
 * El numerador es 1 porque la tetrada de la camara se construye con energia
 * local unidad (ver photonMomentumFromDirection).
 *
 * Casos limite conocidos, comprobados en los tests:
 *  - L = 0 en Schwarzschild:  g = sqrt(1 - 3/r)   (orbita kepleriana)
 *  - emisor estatico:         g = sqrt(1 - 2/r)   (redshift gravitacional puro)
 *  - L > 0 con disco prograde: g > 1 posible, el lado que se acerca
 */
export function redshiftFactor(
  r: number,
  E: number,
  L: number,
  p: BHParams,
  prograde = true,
): number {
  const Om = circularOmega(r, p, prograde)
  const ut = circularUt(r, p, prograde)
  if (!Number.isFinite(ut) || ut <= 0) return NaN
  const denom = ut * (E - Om * L)
  return denom > 0 ? 1 / denom : NaN
}

/**
 * Corrimiento gravitacional de un emisor ESTATICO en el ecuador (sin rotacion),
 * medido en el infinito: g = sqrt(-g_tt) = sqrt(1 - 2/r + q^2/r^2).
 * Se separa de `redshiftFactor` porque un emisor estatico no sigue una geodesica.
 */
export function staticRedshift(r: number, p: BHParams): number {
  const v = 1 - 2 / r + (p.q * p.q) / (r * r)
  return v <= 0 ? 0 : Math.sqrt(v)
}

/**
 * Eficiencia de conversion masa-energia del disco delgado:
 * eta = 1 - E_ISCO. Vale 0.0572 para Schwarzschild y ~0.42 para Kerr extremal.
 */
export function accretionEfficiency(p: BHParams, prograde = true): number {
  const rIsco = iscoRadius(p, prograde)
  const e = circularEnergy(rIsco, p, prograde)
  return 1 - e
}

// ---------------------------------------------------------------------------
// Potencial electromagnetico (solo relevante para particulas de prueba cargadas)
// ---------------------------------------------------------------------------

/**
 * Cuadripotencial de Kerr-Newman: A_mu = -(q r / Sigma) (dt - a sin^2(theta) dphi),
 * es decir A_t = -q r / Sigma, A_phi = q r a sin^2(theta) / Sigma.
 *
 * Los fotones son neutros y no lo sienten: la carga les afecta solo a traves de
 * la metrica (via Delta). Este potencial solo interviene en la fuerza de Lorentz
 * sobre particulas de prueba cargadas (ver `orbits.ts`).
 */
export function emPotential(
  r: number,
  theta: number,
  p: BHParams,
): { A_t: number; A_phi: number } {
  const Sig = sigma(r, theta, p)
  const s = Math.sin(theta)
  return {
    A_t: (-p.q * r) / Sig,
    A_phi: (p.q * r * p.a * s * s) / Sig,
  }
}

// ---------------------------------------------------------------------------
// Radio de terminacion de rayos
// ---------------------------------------------------------------------------

/**
 * Radio al que se considera que un rayo ha caido: justo por fuera de r_+.
 * En el caso de singularidad desnuda no hay horizonte y el corte se hace cerca
 * de la singularidad en anillo (r -> 0 en el plano ecuatorial).
 */
export function captureRadius(p: BHParams, eps = 1e-3): number {
  const h = horizons(p)
  return h.hasHorizon ? h.rPlus * (1 + eps) : 1e-3
}
