/**
 * Embedding isometrico de la geometria espacial: el "embudo", calculado.
 *
 * ---------------------------------------------------------------------------
 * QUE REPRESENTA, Y QUE NO
 * ---------------------------------------------------------------------------
 * La imagen de la cama elastica es la que mas se usa y la que mas se malinterpreta.
 * Lo que se dibuja aqui es riguroso, pero conviene tener claro su alcance:
 *
 *  - Es la geometria de UNA REBANADA ESPACIAL: t constante y theta = pi/2. No es
 *    el espaciotiempo, que tiene cuatro dimensiones.
 *  - La tercera dimension del dibujo es FICTICIA. Es una dimension auxiliar en la
 *    que se sumerge la superficie para poder verla; no existe fisicamente y nada
 *    "cae" a lo largo de ella.
 *  - Y lo mas importante: la curvatura espacial NO es lo que hace caer a los
 *    objetos. Para velocidades bajas, casi toda la gravedad newtoniana proviene de
 *    la curvatura del TIEMPO, es decir del gradiente de g_tt. Un objeto en reposo
 *    empieza a caer por eso, no por la forma del embudo. De ahi que este modulo
 *    exponga tambien el campo del lapso (`lapseProfile`), que es la parte que la
 *    cama elastica omite.
 *
 * Lo que si es exacto: la superficie es una inmersion ISOMETRICA. Las distancias
 * medidas sobre ella coinciden con las distancias propias de la rebanada, y eso se
 * comprueba en los tests reproduciendo la metrica inducida.
 */

import { bigA, delta, horizons, type BHParams } from './kerrNewman'

export interface EmbeddingPoint {
  /** Radio de Boyer-Lindquist. */
  r: number
  /** Radio circunferencial: R = sqrt(g_phiphi), el que mide la circunferencia. */
  R: number
  /** Altura en la dimension auxiliar de inmersion. */
  z: number
}

export interface EmbeddingResult {
  points: EmbeddingPoint[]
  /**
   * Radio por debajo del cual el embedding FALLA (dz^2 < 0) y por tanto la
   * rebanada no se puede sumergir en espacio euclideo plano. Es NaN si no ocurre.
   *
   * No es un artefacto numerico: para espin alto, la geometria de la rebanada
   * ecuatorial de Kerr no admite inmersion isometrica en E^3 cerca del horizonte.
   * Se suele resolver sumergiendo en espacio de Minkowski en lugar de euclideo.
   */
  embeddingFailsBelow: number
  /** Altura total desde el borde exterior hasta el punto mas profundo. */
  depth: number
}

/**
 * Paraboloide de Flamm: el embedding exacto de la rebanada ecuatorial de
 * Schwarzschild.
 *
 *   z(r) = sqrt(8M(r - 2M))
 *
 * Se comprueba de inmediato que es isometrico:
 *   dz/dr = sqrt(2M/(r-2M))
 *   dr^2 + dz^2 = dr^2 (1 + 2M/(r-2M)) = dr^2 / (1 - 2M/r)
 * que es justo la parte radial de la metrica inducida.
 */
export function flammParaboloid(r: number, M = 1): number {
  if (r < 2 * M) return NaN
  return Math.sqrt(8 * M * (r - 2 * M))
}

/**
 * Embedding de la rebanada ecuatorial de Kerr-Newman.
 *
 * La metrica inducida en t = cte, theta = pi/2 es
 *   dl^2 = (Sigma/Delta) dr^2 + (A/Sigma) dphi^2
 * que en el ecuador (Sigma = r^2) queda
 *   dl^2 = (r^2/Delta) dr^2 + (A/r^2) dphi^2
 *
 * Para sumergirla como superficie de revolucion (R(r), z(r)) hay que igualar
 *   R = sqrt(A)/r          (para que la circunferencia coincida)
 *   dR^2 + dz^2 = (r^2/Delta) dr^2
 * de donde
 *   dz/dr = sqrt(r^2/Delta - (dR/dr)^2)
 *
 * Ese radicando puede volverse NEGATIVO para espin alto: ahi la superficie no
 * admite inmersion isometrica en espacio euclideo, y se reporta en
 * `embeddingFailsBelow`.
 */
export function equatorialEmbedding(
  p: BHParams,
  rMax = 20,
  samples = 600,
): EmbeddingResult {
  const h = horizons(p)
  const rMin = h.hasHorizon ? h.rPlus : 1e-3

  /** Radio circunferencial R(r) = sqrt(A)/r en el ecuador. */
  const Rof = (r: number) => Math.sqrt(bigA(r, Math.PI / 2, p)) / r

  // dR/dr por diferencias centradas: A(r) es un polinomio, pero derivarlo a mano
  // aqui no aporta nada y esto es CPU fuera del camino critico.
  const dRdr = (r: number) => {
    const hh = 1e-6 * Math.max(1, r)
    return (Rof(r + hh) - Rof(r - hh)) / (2 * hh)
  }

  // Se integra z de fuera hacia dentro para que z = 0 quede en el borde interior
  // alcanzable y la superficie "cuelgue" hacia abajo como el embudo clasico.
  const points: EmbeddingPoint[] = []
  let failBelow = NaN

  // Muestreo mas fino cerca del horizonte, donde la pendiente diverge.
  const rs: number[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    // Reparto cuadratico: concentra puntos junto a rMin.
    rs.push(rMin * (1 + 1e-9) + (rMax - rMin) * t * t)
  }

  // Integracion desde rMax hacia dentro.
  let z = 0
  const zs = new Array<number>(rs.length).fill(0)
  for (let i = rs.length - 1; i > 0; i--) {
    const rA = rs[i]
    const rB = rs[i - 1]
    const dr = rA - rB
    const mid = 0.5 * (rA + rB)
    const dR = dRdr(mid)
    const radicand = (mid * mid) / delta(mid, p) - dR * dR
    if (radicand < 0) {
      // A partir de aqui hacia dentro no hay inmersion euclidea.
      if (Number.isNaN(failBelow)) failBelow = mid
      zs[i - 1] = z
      continue
    }
    z -= Math.sqrt(radicand) * dr
    zs[i - 1] = z
  }

  // Renormalizar para que el punto mas profundo quede en z = 0 y crezca hacia fuera.
  const zMin = Math.min(...zs)
  for (let i = 0; i < rs.length; i++) {
    points.push({ r: rs[i], R: Rof(rs[i]), z: zs[i] - zMin })
  }

  return {
    points,
    embeddingFailsBelow: failBelow,
    depth: points.length ? points[points.length - 1].z : 0,
  }
}

// ---------------------------------------------------------------------------
// Embedding de la superficie del horizonte
// ---------------------------------------------------------------------------

/**
 * Espin critico por encima del cual la superficie del horizonte de Kerr NO admite
 * inmersion isometrica en espacio euclideo: a/M = sqrt(3)/2 ~ 0.8660 (Smarr 1973).
 */
export const HORIZON_EMBEDDING_CRITICAL_SPIN = Math.sqrt(3) / 2

export interface HorizonEmbeddingResult {
  /** Perfil (R, z) de la superficie de revolucion, de polo a polo. */
  profile: Array<{ theta: number; R: number; z: number }>
  /** true si existe alguna latitud donde el embedding euclideo falla. */
  fails: boolean
  /**
   * Extension angular del casquete polar no sumergible, en radianes desde el polo.
   * NaN si el embedding no falla.
   *
   * Se reporta la EXTENSION del casquete y no la latitud donde empieza a fallar,
   * porque el fallo arranca siempre en el polo exacto: la latitud de inicio no
   * distingue un espin de otro, y la extension si crece con el espin.
   */
  failCapAngle: number
  /** Area propia del horizonte, 4 pi (r+^2 + a^2). */
  area: number
}

/**
 * Embedding de la 2-geometria del horizonte de sucesos.
 *
 * La metrica inducida en r = r+ es
 *   ds^2 = Sigma_H dtheta^2 + ((r+^2 + a^2)^2 sin^2(theta) / Sigma_H) dphi^2
 * con Sigma_H = r+^2 + a^2 cos^2(theta).
 *
 * Sumergiendola como superficie de revolucion (R(theta), z(theta)):
 *   R = (r+^2 + a^2) sin(theta) / sqrt(Sigma_H)
 *   (dR/dtheta)^2 + (dz/dtheta)^2 = Sigma_H
 *
 * El radicando de dz/dtheta se anula en los polos y, desarrollando a orden theta^2,
 * vale theta^2 (r+^2 + a^2 - 4a^2). Es negativo cuando r+^2 < 3a^2, condicion que se
 * alcanza exactamente en a/M = sqrt(3)/2: ahi r+ = 1.5 y r+^2 = 2.25 = 3a^2.
 *
 * Por encima de ese espin el horizonte esta demasiado achatado en los polos para
 * caber en espacio euclideo, y hay que sumergirlo en Minkowski. Es un resultado
 * clasico y una de las pocas afirmaciones cuantitativas y comprobables que se
 * pueden hacer sobre "la forma" de un horizonte.
 */
export function horizonEmbedding(p: BHParams, samples = 400): HorizonEmbeddingResult {
  const h = horizons(p)
  const profile: Array<{ theta: number; R: number; z: number }> = []
  if (!h.hasHorizon) {
    return { profile, fails: false, failCapAngle: NaN, area: NaN }
  }

  const rp = h.rPlus
  const a2 = p.a * p.a
  const K = rp * rp + a2

  const sigmaH = (th: number) => rp * rp + a2 * Math.cos(th) * Math.cos(th)
  const Rof = (th: number) => (K * Math.sin(th)) / Math.sqrt(sigmaH(th))

  let fails = false
  let capAngle = 0
  let z = 0
  for (let i = 0; i <= samples; i++) {
    const th = (Math.PI * i) / samples
    const R = Rof(th)
    profile.push({ theta: th, R, z })

    if (i < samples) {
      const thNext = (Math.PI * (i + 1)) / samples
      const dth = thNext - th
      const mid = 0.5 * (th + thNext)
      const hh = 1e-7
      const dR = (Rof(mid + hh) - Rof(mid - hh)) / (2 * hh)
      const radicand = sigmaH(mid) - dR * dR
      if (radicand < 0) {
        fails = true
        // El casquete no sumergible se mide desde el polo mas cercano.
        capAngle = Math.max(capAngle, Math.min(mid, Math.PI - mid))
        // Sin inmersion euclidea: se continua con dz = 0 para no romper el perfil.
        continue
      }
      z += Math.sqrt(radicand) * dth
    }
  }

  return {
    profile,
    fails,
    failCapAngle: fails ? capAngle : NaN,
    area: 4 * Math.PI * K,
  }
}

/**
 * Lapso alpha = sqrt(-g_tt) en el ecuador, que es el ritmo del tiempo propio
 * respecto al tiempo coordenado.
 *
 * Para Schwarzschild vale sqrt(1 - 2M/r). ESTA es la magnitud cuyo gradiente
 * produce la caida de un objeto lento, y la que la imagen del embudo no muestra.
 *
 * Ojo: en Kerr no existe observador estatico dentro de la ergosfera, asi que ahi
 * -g_tt se vuelve negativo y esta cantidad deja de ser el ritmo de un observador
 * estatico. Se devuelve NaN en esa region en lugar de un numero sin significado.
 */
export function staticLapse(r: number, p: BHParams): number {
  // -g_tt = (Delta - a^2 sin^2 theta)/Sigma, en el ecuador con Sigma = r^2.
  const v = (delta(r, p) - p.a * p.a) / (r * r)
  return v <= 0 ? NaN : Math.sqrt(v)
}

export interface LapseSample {
  r: number
  /** Lapso alpha = dtau/dt del observador estatico; NaN dentro de la ergosfera. */
  alpha: number
  /**
   * Aceleracion propia necesaria para mantenerse estatico, que es lo que se
   * siente como "peso". Para Schwarzschild vale M/(r^2 sqrt(1-2M/r)) y diverge en
   * el horizonte, a diferencia de la curvatura, que ahi es finita.
   */
  properAcceleration: number
}

/**
 * Perfil radial del lapso y de la aceleracion propia, para la capa de dilatacion
 * temporal de la vista de malla.
 */
export function lapseProfile(p: BHParams, rMax = 20, samples = 400): LapseSample[] {
  const h = horizons(p)
  const rMin = h.hasHorizon ? h.rPlus : 1e-3
  const out: LapseSample[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const r = rMin * (1 + 1e-6) + (rMax - rMin) * t * t
    const alpha = staticLapse(r, p)
    // a = d(ln alpha)/dr en modulo, medida con la metrica radial: a = alpha' / (alpha sqrt(g_rr)).
    const hh = 1e-6 * Math.max(1, r)
    const aPlus = staticLapse(r + hh, p)
    const aMinus = staticLapse(r - hh, p)
    let acc = NaN
    if (Number.isFinite(alpha) && Number.isFinite(aPlus) && Number.isFinite(aMinus) && alpha > 0) {
      const dAlpha = (aPlus - aMinus) / (2 * hh)
      // sqrt(g^rr) = sqrt(Delta)/r en el ecuador.
      const sqrtGrrInv = Math.sqrt(Math.max(delta(r, p), 0)) / r
      acc = Math.abs((dAlpha / alpha) * sqrtGrrInv)
    }
    out.push({ r, alpha, properAcceleration: acc })
  }
  return out
}

/**
 * Estiramiento radial: cuanta distancia PROPIA hay por unidad de distancia
 * coordenada, sqrt(g_rr) = r/sqrt(Delta) en el ecuador.
 *
 * Es la version cuantitativa de "la malla se estira": vale 1 lejos y diverge en el
 * horizonte. Es lo que hace que la distancia propia hasta el horizonte sea mayor
 * que la diferencia de coordenadas.
 */
export function radialStretch(r: number, p: BHParams): number {
  const d = delta(r, p)
  return d <= 0 ? Infinity : r / Math.sqrt(d)
}

/**
 * Distancia propia radial entre r1 y r2 en el ecuador, integrando sqrt(g_rr) dr.
 * Se usa para etiquetar la malla con distancias reales en lugar de coordenadas.
 */
export function properRadialDistance(
  r1: number,
  r2: number,
  p: BHParams,
  samples = 4000,
): number {
  const lo = Math.min(r1, r2)
  const hi = Math.max(r1, r2)
  const dr = (hi - lo) / samples
  let sum = 0
  for (let i = 0; i < samples; i++) {
    const r = lo + (i + 0.5) * dr
    const s = radialStretch(r, p)
    if (!Number.isFinite(s)) return Infinity
    sum += s * dr
  }
  return sum
}
