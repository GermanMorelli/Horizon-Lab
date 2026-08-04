/**
 * Color de cuerpo negro: ley de Planck -> CIE XYZ -> sRGB lineal.
 *
 * ---------------------------------------------------------------------------
 * Por que basta con una LUT indexada por temperatura
 * ---------------------------------------------------------------------------
 * La radiacion de un cuerpo negro a temperatura T, vista con un corrimiento
 * total g = nu_obs/nu_emit, es EXACTAMENTE un cuerpo negro a temperatura g T:
 *
 *   I_nu(obs) = g^3 I_nu(emit, nu/g) = g^3 B_nu(nu/g, T) = B_nu(nu, g T)
 *
 * (identidad de la funcion de Planck, verificada en `tests/physics.spec.ts`).
 *
 * Por eso el shader no aplica un factor g^4 sobre un color fijo: consulta la LUT
 * directamente en g*T. Eso da simultaneamente el brillo y el color correctos, e
 * incorpora gratis que la banda visible solo capta una fraccion del flujo
 * bolometrico -- razon por la cual el disco de un agujero estelar (T ~ 10^7 K,
 * pico en rayos X) se ve tenue y azulado en optico, mientras el de un
 * supermasivo (T ~ 10^5 K) se ve brillante y naranja.
 *
 * La version bolometrica de lo mismo es la relacion familiar
 * sigma (g T)^4 = g^4 sigma T^4.
 */

import { C, H_PLANCK, K_B } from './units'

// ---------------------------------------------------------------------------
// Funciones de igualacion de color CIE 1931 (ajuste gaussiano por tramos)
// ---------------------------------------------------------------------------

/**
 * Gaussiana asimetrica g(x; mu, s1, s2) usada por el ajuste analitico de
 * Wyman, Sloan & Shirley (2013), "Simple Analytic Approximations to the
 * CIE XYZ Color Matching Functions", JCGT 2(2).
 */
function piecewiseGauss(x: number, mu: number, s1: number, s2: number): number {
  const t = (x - mu) / (x < mu ? s1 : s2)
  return Math.exp(-0.5 * t * t)
}

/** x barra (lambda en nm). */
export function cieX(lambda: number): number {
  return (
    1.056 * piecewiseGauss(lambda, 599.8, 37.9, 31.0) +
    0.362 * piecewiseGauss(lambda, 442.0, 16.0, 26.7) -
    0.065 * piecewiseGauss(lambda, 501.1, 20.4, 26.2)
  )
}

/** y barra (lambda en nm). Es tambien la funcion de luminosidad fotopica. */
export function cieY(lambda: number): number {
  return (
    0.821 * piecewiseGauss(lambda, 568.8, 46.9, 40.5) +
    0.286 * piecewiseGauss(lambda, 530.9, 16.3, 31.1)
  )
}

/** z barra (lambda en nm). */
export function cieZ(lambda: number): number {
  return (
    1.217 * piecewiseGauss(lambda, 437.0, 11.8, 36.0) +
    0.681 * piecewiseGauss(lambda, 459.0, 26.0, 13.8)
  )
}

// ---------------------------------------------------------------------------
// Ley de Planck
// ---------------------------------------------------------------------------

/**
 * Radiancia espectral B_lambda(T) en W m^-3 sr^-1, con lambda en metros.
 * B = (2 h c^2 / lambda^5) / (exp(h c / (lambda k T)) - 1)
 */
export function planckSpectral(lambdaMeters: number, T: number): number {
  const l5 = Math.pow(lambdaMeters, 5)
  const x = (H_PLANCK * C) / (lambdaMeters * K_B * T)
  // Para x grande exp(x) desborda; el limite de Wien evita Infinity/Infinity.
  if (x > 700) return ((2 * H_PLANCK * C * C) / l5) * Math.exp(-x)
  return (2 * H_PLANCK * C * C) / (l5 * (Math.expm1(x)))
}

/** Ley de desplazamiento de Wien: lambda_pico en metros. */
export function wienPeakWavelength(T: number): number {
  return 2.897771955e-3 / T
}

/** Radiancia espectral B_nu(nu, T) en W m^-2 sr^-1 Hz^-1. */
export function planckSpectralNu(nu: number, T: number): number {
  const x = (H_PLANCK * nu) / (K_B * T)
  const pre = (2 * H_PLANCK * nu * nu * nu) / (C * C)
  if (x > 700) return pre * Math.exp(-x)
  return pre / Math.expm1(x)
}

// ---------------------------------------------------------------------------
// Integracion espectral -> XYZ -> sRGB lineal
// ---------------------------------------------------------------------------

const LAMBDA_MIN = 360 // nm
const LAMBDA_MAX = 830 // nm
const LAMBDA_STEP = 2 // nm

/** Matriz XYZ -> sRGB lineal (primarios sRGB, blanco D65). */
const XYZ_TO_RGB = [
  [3.2406, -1.5372, -0.4986],
  [-0.9689, 1.8758, 0.0415],
  [0.0557, -0.204, 1.057],
] as const

export interface BlackbodySample {
  /** RGB lineal con luminancia Rec.709 normalizada a 1 (solo cromaticidad). */
  chroma: [number, number, number]
  /**
   * Radiancia integrada en la banda visible, ponderada por y barra
   * (unidades arbitrarias pero consistentes entre temperaturas).
   */
  visibleRadiance: number
}

/**
 * Color y radiancia visible de un cuerpo negro a temperatura T.
 * Fuera de gamut se desatura hacia el blanco sumando el minimo negativo a los
 * tres canales, que es el mapeo estandar y preserva la luminancia.
 */
export function blackbodySample(T: number): BlackbodySample {
  let X = 0
  let Y = 0
  let Z = 0
  for (let l = LAMBDA_MIN; l <= LAMBDA_MAX; l += LAMBDA_STEP) {
    const B = planckSpectral(l * 1e-9, T)
    X += B * cieX(l)
    Y += B * cieY(l)
    Z += B * cieZ(l)
  }
  X *= LAMBDA_STEP
  Y *= LAMBDA_STEP
  Z *= LAMBDA_STEP

  const sum = X + Y + Z
  if (!(sum > 0) || !Number.isFinite(sum)) {
    return { chroma: [1, 1, 1], visibleRadiance: 0 }
  }

  // Normalizar la cromaticidad (Y = 1) antes de pasar a RGB.
  const xn = X / Y
  const zn = Z / Y
  let r = XYZ_TO_RGB[0][0] * xn + XYZ_TO_RGB[0][1] * 1 + XYZ_TO_RGB[0][2] * zn
  let g = XYZ_TO_RGB[1][0] * xn + XYZ_TO_RGB[1][1] * 1 + XYZ_TO_RGB[1][2] * zn
  let b = XYZ_TO_RGB[2][0] * xn + XYZ_TO_RGB[2][1] * 1 + XYZ_TO_RGB[2][2] * zn

  // Desaturar hacia blanco si cae fuera del gamut sRGB.
  const min = Math.min(r, g, b)
  if (min < 0) {
    r -= min
    g -= min
    b -= min
  }

  // Renormalizar a luminancia Rec.709 unidad.
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  if (luma > 0) {
    r /= luma
    g /= luma
    b /= luma
  }

  return { chroma: [r, g, b], visibleRadiance: Y }
}

// ---------------------------------------------------------------------------
// LUT para la GPU
// ---------------------------------------------------------------------------

/** Rango de temperaturas cubierto por la LUT, en log10(K). */
export const LUT_LOG_T_MIN = 2.5 // ~316 K
export const LUT_LOG_T_MAX = 9.0 // 1e9 K
export const LUT_SIZE = 512

/** Temperatura de referencia con la que se normaliza la radiancia de la LUT. */
export const LUT_T_REF = 1e4 // K

/**
 * Construye la LUT que consume el shader: RGBA32F de LUT_SIZE x 1 donde
 *   RGB = cromaticidad (RGB lineal, luminancia 1)
 *   A   = log10(radiancia visible / radiancia visible a LUT_T_REF)
 *
 * La radiancia se guarda en log10 porque cubre unas 20 decadas entre 10^3 y
 * 10^9 K: en logaritmo cabe en float sin problemas y la interpolacion lineal
 * de la textura es mucho mas fiel.
 */
export function buildBlackbodyLUT(): Float32Array {
  const data = new Float32Array(LUT_SIZE * 4)
  const ref = blackbodySample(LUT_T_REF).visibleRadiance

  for (let i = 0; i < LUT_SIZE; i++) {
    const logT = LUT_LOG_T_MIN + ((LUT_LOG_T_MAX - LUT_LOG_T_MIN) * i) / (LUT_SIZE - 1)
    const s = blackbodySample(Math.pow(10, logT))
    const rel = ref > 0 ? s.visibleRadiance / ref : 0
    data[i * 4 + 0] = s.chroma[0]
    data[i * 4 + 1] = s.chroma[1]
    data[i * 4 + 2] = s.chroma[2]
    data[i * 4 + 3] = rel > 0 ? Math.log10(rel) : -30
  }
  return data
}

/**
 * Radiancia visible de un cuerpo negro a T, relativa a la de LUT_T_REF.
 * Es el mismo valor que el shader obtiene de la LUT (canal alfa, en log10), y se
 * usa en CPU para calibrar el brillo del disco.
 *
 * Crece aproximadamente lineal con T por encima de ~2x10^4 K: en la banda
 * visible ya se esta en el regimen de Rayleigh-Jeans, donde B_lambda ~ T. De ahi
 * que un disco mas caliente (agujero menos masivo, T ~ M^-1/4) tenga mas brillo
 * superficial visible, aunque su cromaticidad ya este saturada en blanco-azul.
 */
export function relativeVisibleRadiance(T: number): number {
  const ref = blackbodySample(LUT_T_REF).visibleRadiance
  const cur = blackbodySample(Math.max(T, 1)).visibleRadiance
  return ref > 0 ? cur / ref : 0
}

/**
 * Fraccion del flujo bolometrico que cae en la banda visible (360-830 nm).
 * Se usa en el HUD para explicar por que un disco a 10^7 K se ve tenue en optico.
 */
export function visibleFraction(T: number): number {
  let visible = 0
  for (let l = LAMBDA_MIN; l <= LAMBDA_MAX; l += LAMBDA_STEP) {
    visible += planckSpectral(l * 1e-9, T) * LAMBDA_STEP * 1e-9
  }
  // Integral bolometrica: sigma T^4 / pi  (radiancia total de un cuerpo negro).
  const bolometric = (5.670374419e-8 * Math.pow(T, 4)) / Math.PI
  return bolometric > 0 ? visible / bolometric : 0
}
