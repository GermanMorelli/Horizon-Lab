/**
 * Borde analitico de la sombra (Bardeen 1973) generalizado a Kerr-Newman.
 *
 * Las orbitas esfericas de fotones son los rayos criticos que separan captura de
 * escape: su proyeccion en el cielo del observador es el borde de la sombra.
 * Imponiendo R(r) = 0 y R'(r) = 0 sobre
 *
 *   R(r)/E^2 = [(r^2 + a^2) - a xi]^2 - Delta [(xi - a)^2 + eta]
 *
 * con xi = L/E y eta = Q_Carter/E^2, se obtiene en forma cerrada
 *
 *   xi(r)  = [(r^2 + a^2)(r - 1) - 2 r Delta] / (a (r - 1))
 *   eta(r) = 4 r^2 Delta / (r - 1)^2 - (xi - a)^2
 *
 * Para q = 0 esto coincide identicamente con las expresiones clasicas de Bardeen
 *   xi = [M(r^2 - a^2) - r Delta] / (a (r - M))
 *   eta = r^3 [4 M Delta - r (r - M)^2] / (a^2 (r - M)^2)
 * (equivalencia verificada algebraicamente y comprobada en los tests).
 *
 * Este modulo es la referencia independiente contra la que se valida la sombra
 * que produce el trazador: no comparte codigo con el integrador.
 */

import { delta, photonCircularRadius, type BHParams } from './kerrNewman'
import { scanRoot } from './rootfind'

/** Parametros de impacto criticos de la orbita esferica de fotones de radio r. */
export function criticalImpactParams(r: number, p: BHParams): { xi: number; eta: number } {
  const a = p.a
  const Del = delta(r, p)
  const rm1 = r - 1
  const xi = ((r * r + a * a) * rm1 - 2 * r * Del) / (a * rm1)
  const eta = (4 * r * r * Del) / (rm1 * rm1) - (xi - a) * (xi - a)
  return { xi, eta }
}

/** Forma clasica de Bardeen (solo valida para q = 0). Referencia para los tests. */
export function criticalImpactParamsBardeenKerr(
  r: number,
  a: number,
): { xi: number; eta: number } {
  const Del = r * r - 2 * r + a * a
  const rm1 = r - 1
  const xi = (r * r - a * a - r * Del) / (a * rm1)
  const eta = (r * r * r * (4 * Del - r * rm1 * rm1)) / (a * a * rm1 * rm1)
  return { xi, eta }
}

/**
 * Punto del borde de la sombra en el cielo de un observador asintotico con
 * inclinacion `inc` (angulo entre el eje de espin y la linea de vision).
 *
 *   alpha = -xi / sin(inc)
 *   beta  = +-sqrt(eta + a^2 cos^2(inc) - xi^2 cot^2(inc))
 *
 * Coordenadas celestes en unidades de M/r_obs radianes. Devuelve null si el
 * radio r no contribuye al borde para esa inclinacion (beta^2 < 0).
 */
export function rimPoint(
  r: number,
  inc: number,
  p: BHParams,
): { alpha: number; beta: number } | null {
  const { xi, eta } = criticalImpactParams(r, p)
  const si = Math.sin(inc)
  const ci = Math.cos(inc)
  if (Math.abs(si) < 1e-9) {
    // Vista polar: cot(inc) diverge, asi que beta^2 solo es finito donde xi = 0.
    // Un unico radio contribuye al borde; la circunferencia completa la genera
    // `shadowRim`, que trata este caso aparte. Aqui se devuelve null salvo en
    // ese radio critico.
    if (Math.abs(xi) > 1e-6) return null
    const rad2 = eta + p.a * p.a
    return rad2 < 0 ? null : { alpha: Math.sqrt(rad2), beta: 0 }
  }
  const alpha = -xi / si
  const beta2 = eta + p.a * p.a * ci * ci - (xi * xi * ci * ci) / (si * si)
  if (beta2 < 0) return null
  return { alpha, beta: Math.sqrt(beta2) }
}

/**
 * Curva completa del borde de la sombra, muestreada en `n` puntos por rama.
 * Devuelve la mitad beta >= 0; la sombra es simetrica respecto al eje alpha.
 *
 * Para a -> 0 el borde degenera a un circulo y xi diverge, asi que ese caso se
 * trata aparte de forma exacta.
 */
export function shadowRim(
  p: BHParams,
  inc: number,
  n = 512,
): Array<{ alpha: number; beta: number }> {
  /** Semicircunferencia superior de radio b (mitad beta >= 0). */
  const circle = (b: number) => {
    const pts: Array<{ alpha: number; beta: number }> = []
    for (let i = 0; i <= n; i++) {
      const t = (Math.PI * i) / n
      pts.push({ alpha: b * Math.cos(t), beta: b * Math.sin(t) })
    }
    return pts
  }

  // Sin espin la solucion es estatica y esfericamente simetrica: la sombra es
  // un circulo de radio b_c a cualquier inclinacion.
  if (Math.abs(p.a) < 1e-7) return circle(criticalImpactParameterStatic(p))

  // Vista polar (de frente al eje de espin): la simetria axial hace que la
  // sombra sea circular por mucho que el espin sea maximo.
  if (Math.abs(Math.sin(inc)) < 1e-6) return circle(polarShadowRadius(p))

  // El borde lo generan los radios entre la orbita de fotones prograda y la
  // retrograda; fuera de ese intervalo no hay orbitas esfericas de fotones.
  const rPro = photonCircularRadius(p, true)
  const rRet = photonCircularRadius(p, false)
  const lo = Math.min(rPro, rRet)
  const hi = Math.max(rPro, rRet)

  const pts: Array<{ alpha: number; beta: number }> = []
  for (let i = 0; i <= n; i++) {
    const r = lo + ((hi - lo) * i) / n
    const pt = rimPoint(r, inc, p)
    if (pt) pts.push(pt)
  }
  return pts
}

/**
 * Parametro de impacto critico b_c para el caso estatico (a = 0).
 * Es la raiz de xi = 0, es decir el radio de la esfera de fotones r_ph
 * (solucion de r^2 - 3r + 2q^2 = 0), evaluado en
 *   b_c^2 = 4 r_ph^2 Delta(r_ph) / (r_ph - 1)^2.
 *
 * Vale sqrt(27) = 3 sqrt(3) para Schwarzschild y 4 para RN extremal (q = 1).
 */
export function criticalImpactParameterStatic(p: BHParams): number {
  const rPh = (3 + Math.sqrt(9 - 8 * p.q * p.q)) / 2
  const Del = delta(rPh, p)
  const rm1 = rPh - 1
  return Math.sqrt((4 * rPh * rPh * Del) / (rm1 * rm1))
}

export interface ShadowMetrics {
  /** Radio maximo del borde, en unidades de M/r_obs. */
  rMax: number
  /** Radio minimo del borde. */
  rMin: number
  /** Radio areal equivalente sqrt(Area/pi). Es el "tamano" de la sombra. */
  rAreal: number
  /** Desplazamiento del centroide en alpha (mide el arrastre de marcos). */
  centroidAlpha: number
  /**
   * Asimetria de la sombra (0 = circular). Definida como
   * (max - min) / (max + min) sobre el radio medido desde el centroide.
   */
  asymmetry: number
}

/** Metricas geometricas del borde de la sombra para el HUD. */
export function shadowMetrics(p: BHParams, inc: number, n = 1024): ShadowMetrics {
  const half = shadowRim(p, inc, n)
  if (half.length === 0) {
    return { rMax: NaN, rMin: NaN, rAreal: NaN, centroidAlpha: NaN, asymmetry: NaN }
  }

  // Contorno cerrado: mitad superior + espejo inferior.
  const closed = [...half, ...half.slice(0, -1).reverse().map((q) => ({ alpha: q.alpha, beta: -q.beta }))]

  // Area por la formula del poligono (shoelace) y centroide en alpha.
  let area2 = 0
  let cx = 0
  for (let i = 0; i < closed.length; i++) {
    const A = closed[i]
    const B = closed[(i + 1) % closed.length]
    const cross = A.alpha * B.beta - B.alpha * A.beta
    area2 += cross
    cx += (A.alpha + B.alpha) * cross
  }
  const area = Math.abs(area2 / 2)
  const centroidAlpha = area2 !== 0 ? cx / (3 * area2) : 0

  let rMax = -Infinity
  let rMin = Infinity
  for (const q of closed) {
    const d = Math.hypot(q.alpha - centroidAlpha, q.beta)
    if (d > rMax) rMax = d
    if (d < rMin) rMin = d
  }

  return {
    rMax,
    rMin,
    rAreal: Math.sqrt(area / Math.PI),
    centroidAlpha,
    asymmetry: (rMax - rMin) / (rMax + rMin),
  }
}

/**
 * Radio angular de la sombra medido por un observador estatico a radio finito r_obs.
 *
 * Para a = 0 es exacto:  sin^2(alpha) = b_c^2 (-g_tt(r_obs)) / r_obs^2,
 * que para Schwarzschild da la formula clasica sin^2 = 27(1 - 2/r)/r^2.
 *
 * Para a != 0 la sombra no es circular y se usa el radio areal asintotico con la
 * misma correccion de lapso; es una aproximacion buena para r_obs >> M (el caso
 * normal de observacion) y se documenta como tal en el HUD.
 */
export function shadowAngularRadius(rObs: number, p: BHParams, inc = Math.PI / 2): number {
  const b =
    Math.abs(p.a) < 1e-7
      ? criticalImpactParameterStatic(p)
      : shadowMetrics(p, inc, 256).rAreal
  const minusGtt = 1 - 2 / rObs + (p.q * p.q) / (rObs * rObs)
  if (minusGtt <= 0) return NaN
  const sinA = (b / rObs) * Math.sqrt(minusGtt)
  return sinA >= 1 ? Math.PI / 2 : Math.asin(sinA)
}

/**
 * Radio de la orbita esferica de fotones polar (la que alcanza el eje, xi = 0).
 * Es el unico radio que contribuye al borde visto desde el eje de espin.
 */
export function polarPhotonRadius(p: BHParams): number {
  if (Math.abs(p.a) < 1e-9) return (3 + Math.sqrt(9 - 8 * p.q * p.q)) / 2
  const rPro = photonCircularRadius(p, true)
  const rRet = photonCircularRadius(p, false)
  return scanRoot(
    (r) => criticalImpactParams(r, p).xi,
    Math.min(rPro, rRet),
    Math.max(rPro, rRet),
    2048,
  )
}

/**
 * Radio de la sombra vista desde el eje de espin (inclinacion 0), en unidades
 * de M/r_obs: sqrt(eta + a^2) evaluado en la orbita de fotones polar.
 *
 * Decrece solo modestamente con el espin -- de sqrt(27) = 5.196 para a = 0 a
 * ~4.83 para Kerr extremal -- y permanece circular: el espin no rompe la
 * simetria de la sombra si se mira de frente al eje.
 */
export function polarShadowRadius(p: BHParams): number {
  if (Math.abs(p.a) < 1e-7) return criticalImpactParameterStatic(p)
  const rPol = polarPhotonRadius(p)
  if (!Number.isFinite(rPol)) return NaN
  const { eta } = criticalImpactParams(rPol, p)
  const rad2 = eta + p.a * p.a
  return rad2 < 0 ? NaN : Math.sqrt(rad2)
}
