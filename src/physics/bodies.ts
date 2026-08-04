/**
 * Cuerpos de prueba: planetas, estrellas y objetos compactos en orbita.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTO ES RIGUROSO
 * ---------------------------------------------------------------------------
 * Un planeta o una estrella orbitando un agujero negro ES una particula de
 * prueba: su masa es despreciable frente a la del agujero, asi que no perturba la
 * metrica y sigue exactamente una geodesica temporal del fondo fijo. No es una
 * aproximacion newtoniana ni un modelo: es relatividad general exacta, y la
 * calcula el integrador ya validado de `orbits.ts` (precesion del periastro contra
 * la formula epiciclica exacta, Lense-Thirring, estabilidad del ISCO).
 *
 * Hay comprobacion observacional directa: la estrella S2 orbita Sgr A* con un
 * periastro de ~1400 radios gravitacionales, y su precesion del periastro
 * (~12 minutos de arco por orbita) la midio GRAVITY en 2020 de acuerdo con RG.
 *
 * ---------------------------------------------------------------------------
 * LAS GALAXIAS NO VAN AQUI
 * ---------------------------------------------------------------------------
 * Una galaxia tiene ~10^11 masas solares y ~30 kpc de diametro: es mucho MAS
 * masiva y MAS grande que cualquier agujero negro. Una galaxia no orbita un
 * agujero negro; el agujero negro esta en su centro. Tratarla como masa puntual en
 * orbita invertiria la jerarquia de tamanos.
 *
 * Lo que si es real es el lente gravitacional de galaxias de FONDO, que produce
 * arcos y anillos de Einstein, y es lo que observan Hubble y JWST. Eso se
 * implementa en el fondo del trazador (`starfield.glsl`), no aqui.
 */

import { C, GM_SUN, M_SUN } from './units'

export type BodyType = 'planet' | 'star' | 'compact'

export interface BodySpec {
  /** Etiqueta legible. */
  label: string
  type: BodyType
  /** Masa en masas solares. */
  massSolar: number
  /** Radio fisico en metros. */
  radiusMeters: number
  /**
   * Temperatura superficial en kelvin, para el color. Los planetas no brillan por
   * si mismos; se les asigna un color de albedo en lugar de una temperatura.
   */
  temperatureK: number
  /** Color de albedo para cuerpos que no radian (planetas), en RGB lineal. */
  albedo?: [number, number, number]
}

/** Radios y masas de referencia (SI). */
export const R_SUN = 6.957e8
export const R_EARTH = 6.371e6
export const R_JUPITER = 6.9911e7
export const M_EARTH_SOLAR = 3.00273e-6
export const M_JUPITER_SOLAR = 9.5458e-4

/**
 * Catalogo de cuerpos. Los valores son los reales de cada objeto, de modo que el
 * radio de marea y el tamano angular que se calculan a partir de ellos tambien lo
 * son.
 */
export const BODY_CATALOG: Record<string, BodySpec> = {
  earth: {
    label: 'Tierra',
    type: 'planet',
    massSolar: M_EARTH_SOLAR,
    radiusMeters: R_EARTH,
    temperatureK: 288,
    albedo: [0.25, 0.42, 0.75],
  },
  jupiter: {
    label: 'Júpiter',
    type: 'planet',
    massSolar: M_JUPITER_SOLAR,
    radiusMeters: R_JUPITER,
    temperatureK: 165,
    albedo: [0.78, 0.68, 0.52],
  },
  sun: {
    label: 'Estrella tipo Sol',
    type: 'star',
    massSolar: 1,
    radiusMeters: R_SUN,
    temperatureK: 5772,
  },
  redGiant: {
    label: 'Gigante roja',
    type: 'star',
    massSolar: 1.2,
    radiusMeters: 100 * R_SUN,
    temperatureK: 3500,
  },
  blueGiant: {
    label: 'Gigante azul',
    type: 'star',
    massSolar: 20,
    radiusMeters: 8 * R_SUN,
    temperatureK: 25000,
  },
  s2: {
    // La estrella que orbita Sgr A*: 16 anos de periodo, periastro a ~1400 r_g.
    label: 'S2 (Sgr A*)',
    type: 'star',
    massSolar: 13.6,
    radiusMeters: 5.5 * R_SUN,
    temperatureK: 25000,
  },
  whiteDwarf: {
    label: 'Enana blanca',
    type: 'compact',
    massSolar: 0.6,
    radiusMeters: 7e6,
    temperatureK: 12000,
  },
  neutronStar: {
    label: 'Estrella de neutrones',
    type: 'compact',
    massSolar: 1.4,
    radiusMeters: 1.2e4,
    temperatureK: 1e6,
  },
}

// ---------------------------------------------------------------------------
// Disrupcion por marea
// ---------------------------------------------------------------------------

/**
 * Radio de marea: la distancia a la que las fuerzas de marea del agujero vencen a
 * la autogravedad del cuerpo y lo desgarran.
 *
 *   r_t ~ R (M_BH / m)^{1/3}
 *
 * Devuelto en unidades de r_g = GM_BH/c^2, que es la unidad del resto del motor.
 * El prefactor es de orden unidad y depende de la estructura interna del cuerpo
 * (aqui se toma 1); lo que importa es el escalado.
 *
 * La consecuencia es contraintuitiva y merece la pena verla: r_t/r_g escala como
 * M_BH^{-2/3}, asi que crece al DISMINUIR la masa del agujero. Una estrella como
 * el Sol se rompe a ~47 r_g de un agujero de 10^6 masas solares (fuera del
 * horizonte, y de ahi que los eventos de disrupcion sean observables), pero
 * alrededor de M87* el radio de marea cae a ~0.14 r_g, DENTRO del horizonte: en los
 * agujeros supermasivos las estrellas caen enteras.
 */
export function tidalRadiusRg(body: BodySpec, bhMassSolar: number): number {
  if (body.massSolar <= 0) return Infinity
  const rtMeters = body.radiusMeters * Math.cbrt(bhMassSolar / body.massSolar)
  const rgMeters = (GM_SUN * bhMassSolar) / (C * C)
  return rtMeters / rgMeters
}

/** El mismo radio de marea, en metros. */
export function tidalRadiusMeters(body: BodySpec, bhMassSolar: number): number {
  return body.radiusMeters * Math.cbrt(bhMassSolar / body.massSolar)
}

export interface TidalVerdict {
  /** Radio de marea en unidades de r_g. */
  rTidal: number
  /** Radio del horizonte exterior en unidades de r_g (para comparar). */
  rHorizon: number
  /** true si el cuerpo se rompe antes de cruzar el horizonte. */
  disrupts: boolean
  /**
   * true si el radio de marea queda DENTRO del horizonte: el cuerpo cae entero,
   * sin desgarrarse, porque para cuando las mareas serian letales ya ha cruzado.
   */
  swallowedWhole: boolean
  /** true si el periastro de la orbita llega al radio de marea. */
  reachesTidalRadius: boolean
}

/**
 * Dictamen de marea para un cuerpo con un periastro dado.
 * `rPeriastron` y el resultado van en unidades de r_g.
 */
export function tidalVerdict(
  body: BodySpec,
  bhMassSolar: number,
  rHorizon: number,
  rPeriastron: number,
): TidalVerdict {
  const rTidal = tidalRadiusRg(body, bhMassSolar)
  const swallowedWhole = rTidal <= rHorizon
  return {
    rTidal,
    rHorizon,
    disrupts: !swallowedWhole && rPeriastron <= rTidal,
    swallowedWhole,
    reachesTidalRadius: rPeriastron <= rTidal,
  }
}

// ---------------------------------------------------------------------------
// Apariencia
// ---------------------------------------------------------------------------

/**
 * Radio angular aparente del cuerpo visto desde la camara, en radianes.
 * @param distanceRg distancia camara-cuerpo en unidades de r_g
 */
export function angularRadiusRad(
  body: BodySpec,
  bhMassSolar: number,
  distanceRg: number,
): number {
  const rgMeters = (GM_SUN * bhMassSolar) / (C * C)
  const dMeters = Math.max(distanceRg * rgMeters, 1)
  return Math.atan(body.radiusMeters / dMeters)
}

/** Radio del cuerpo en unidades de r_g: cuanto ocupa en la escena del motor. */
export function bodyRadiusRg(body: BodySpec, bhMassSolar: number): number {
  const rgMeters = (GM_SUN * bhMassSolar) / (C * C)
  return body.radiusMeters / rgMeters
}

/** Masa del cuerpo en kg, para las lecturas del HUD. */
export function bodyMassKg(body: BodySpec): number {
  return body.massSolar * M_SUN
}

/**
 * Razon de masas cuerpo/agujero. La aproximacion de particula de prueba exige que
 * sea pequena; por encima de ~1e-3 el cuerpo empieza a perturbar la metrica y el
 * modelo deja de ser defendible, asi que la interfaz lo advierte.
 */
export function massRatio(body: BodySpec, bhMassSolar: number): number {
  return body.massSolar / bhMassSolar
}

/** Umbral por encima del cual la aproximacion de particula de prueba se rompe. */
export const TEST_PARTICLE_LIMIT = 1e-3

/**
 * Velocidad de escape newtoniana en la superficie del cuerpo, en m/s.
 * Se usa para contextualizar el radio de marea: es la autogravedad que las mareas
 * tienen que vencer.
 */
export function surfaceEscapeVelocity(body: BodySpec): number {
  return Math.sqrt((2 * GM_SUN * body.massSolar) / body.radiusMeters)
}
