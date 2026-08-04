/**
 * Conversiones entre unidades geometrizadas (G = c = 1, longitudes en M) y
 * unidades fisicas.
 *
 * Todo el motor trabaja internamente con M = 1: en esas unidades la GEOMETRIA
 * de la solucion depende unicamente de los adimensionales a/M y Q/M. La masa
 * entra solo al traducir a unidades fisicas (tamano angular, temperatura del
 * disco, periodo orbital). Ver README, seccion "La subtileza de la masa".
 */

/** Constantes fisicas (SI), valores CODATA / IAU. */
export const G = 6.6743e-11 // m^3 kg^-1 s^-2
export const C = 299792458 // m/s
export const H_PLANCK = 6.62607015e-34 // J s
export const K_B = 1.380649e-23 // J/K
export const HBAR = H_PLANCK / (2 * Math.PI)
export const SIGMA_SB = 5.670374419e-8 // W m^-2 K^-4
export const M_SUN = 1.98892e30 // kg
export const L_SUN = 3.828e26 // W

/**
 * Parametro gravitacional solar nominal de la IAU, en m^3/s^2.
 *
 * Se usa este producto y no G * M_SUN a proposito: GM_sol se conoce con nueve
 * cifras significativas por dinamica del sistema solar, mientras que G y M_sol por
 * separado solo tienen cuatro o cinco. Multiplicarlos por separado desplaza la
 * cuarta cifra y hace que GM/c^3 salga 4.9268 us en vez de los 4.92549 us
 * tabulados.
 */
export const GM_SUN = 1.32712440018e20

/** Longitudes de referencia (m). */
export const AU = 1.495978707e11
export const PARSEC = 3.0856775814913673e16
export const LIGHT_YEAR = C * 365.25 * 86400

/**
 * Radio gravitacional r_g = GM/c^2 en metros.
 * Para 1 M_sol vale 1476.6 m. Es la unidad de longitud del motor (M = 1).
 */
export function gravitationalRadius(massSolar: number): number {
  return (GM_SUN * massSolar) / (C * C)
}

/** r_g para 1 masa solar, en metros. Util para comprobaciones rapidas. */
export const R_G_SUN = gravitationalRadius(1)

/** Radio de Schwarzschild r_s = 2GM/c^2 en metros. */
export function schwarzschildRadius(massSolar: number): number {
  return 2 * gravitationalRadius(massSolar)
}

/** Escala temporal gravitacional t_g = GM/c^3 en segundos (= r_g / c). */
export function gravitationalTime(massSolar: number): number {
  return gravitationalRadius(massSolar) / C
}

/**
 * Temperatura maxima del disco de acrecion delgado (Novikov-Thorne / Shakura-Sunyaev)
 * para una tasa de acrecion dada como fraccion de Eddington.
 *
 * De la escala estandar T ~ (dot_M / (M^2))^{1/4} con dot_M_Edd ~ M se obtiene
 * T_max ~ M^{-1/4}: los agujeros negros estelares tienen discos calientes
 * (rayos X, ~10^7 K) y los supermasivos discos frios (UV/optico, ~10^5 K).
 *
 * La normalizacion se ancla en un valor de referencia bien establecido:
 * un agujero de 10 M_sol acretando al 10% de Eddington con eficiencia 0.1
 * alcanza T_max ~ 1e7 K.
 */
const T_REF = 1.0e7 // K
const M_REF = 10 // M_sol
const EDD_REF = 0.1

export function diskMaxTemperature(
  massSolar: number,
  eddingtonRatio = EDD_REF,
  spinEfficiencyFactor = 1,
): number {
  return (
    T_REF *
    Math.pow(massSolar / M_REF, -0.25) *
    Math.pow(eddingtonRatio / EDD_REF, 0.25) *
    spinEfficiencyFactor
  )
}

/** Luminosidad de Eddington en W. */
export function eddingtonLuminosity(massSolar: number): number {
  // L_Edd = 4 pi G M m_p c / sigma_T ~ 1.26e31 W * (M/M_sol)
  return 1.26e31 * massSolar
}

/**
 * Temperatura de Hawking en kelvin.
 * T_H = hbar * kappa / (2 pi k_B c), con kappa la gravedad superficial
 * en unidades geometrizadas (1/M) convertida a 1/m.
 */
export function hawkingTemperature(kappaGeom: number, massSolar: number): number {
  const kappaSI = (kappaGeom / gravitationalRadius(massSolar)) * C * C // m/s^2
  return (HBAR * kappaSI) / (2 * Math.PI * K_B * C)
}

/**
 * Radio angular aparente (radianes) de un objeto de tamano `radiusInM`
 * (en unidades de M) visto desde una distancia fisica `distanceMeters`.
 */
export function angularRadius(
  radiusInM: number,
  massSolar: number,
  distanceMeters: number,
): number {
  const rMeters = radiusInM * gravitationalRadius(massSolar)
  return Math.atan(rMeters / distanceMeters)
}

/** Radianes -> microsegundos de arco (la unidad del EHT). */
export function radToMicroArcsec(rad: number): number {
  return rad * (180 / Math.PI) * 3600 * 1e6
}

/** Formatea una longitud en metros con la unidad mas legible. */
export function formatLength(meters: number): string {
  const abs = Math.abs(meters)
  if (abs < 1e3) return `${meters.toPrecision(4)} m`
  if (abs < 0.01 * AU) return `${(meters / 1e3).toPrecision(4)} km`
  if (abs < 0.1 * PARSEC) return `${(meters / AU).toPrecision(4)} AU`
  if (abs < 1e3 * PARSEC) return `${(meters / PARSEC).toPrecision(4)} pc`
  return `${(meters / (1e6 * PARSEC)).toPrecision(4)} Mpc`
}

/** Formatea un tiempo en segundos con la unidad mas legible. */
export function formatTime(seconds: number): string {
  const abs = Math.abs(seconds)
  if (abs < 1e-6) return `${(seconds * 1e9).toPrecision(3)} ns`
  if (abs < 1e-3) return `${(seconds * 1e6).toPrecision(3)} µs`
  if (abs < 1) return `${(seconds * 1e3).toPrecision(3)} ms`
  if (abs < 120) return `${seconds.toPrecision(3)} s`
  if (abs < 7200) return `${(seconds / 60).toPrecision(3)} min`
  if (abs < 2 * 86400) return `${(seconds / 3600).toPrecision(3)} h`
  if (abs < 3 * 365.25 * 86400) return `${(seconds / 86400).toPrecision(3)} d`
  return `${(seconds / (365.25 * 86400)).toPrecision(3)} yr`
}

/** Formatea masas en masas solares. */
export function formatMass(massSolar: number): string {
  if (massSolar < 1e3) return `${massSolar.toPrecision(3)} M☉`
  const exp = Math.floor(Math.log10(massSolar))
  const mant = massSolar / Math.pow(10, exp)
  return `${mant.toFixed(2)}×10${superscript(exp)} M☉`
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
function superscript(n: number): string {
  return String(n)
    .split('')
    .map((c) => (c === '-' ? '⁻' : SUPERSCRIPTS[Number(c)] ?? c))
    .join('')
}
