/**
 * Ondas gravitacionales de la binaria: formula del cuadrupolo.
 *
 * A orden dominante (cuadrupolar, campo lejano) la amplitud y la evolucion de
 * frecuencia dependen solo de la masa de chirp, que es la razon de que sea el
 * primer parametro que extraen los detectores.
 *
 * Referencias de validacion usadas en los tests:
 *  - relacion de chirp  df/dt = (96/5) pi^{8/3} (G M_c/c^3)^{5/3} f^{11/3}
 *  - GW150914: m1 ~ 36, m2 ~ 29 M_sol  ->  M_c ~ 28 M_sol, h ~ 1e-21 a 410 Mpc
 *  - la amplitud escala como 1/D y como M_c^{5/3}
 */

import { chirpMass, massToMeters, massToSeconds } from './pn'
import { C, G, M_SUN } from './units'

/** Frecuencia de la onda gravitacional: el doble de la orbital. */
export function gwFrequency(orbitalOmegaGeom: number, totalMassSolar: number): number {
  // Omega esta en unidades de 1/M; se pasa a 1/s dividiendo por GM/c^3.
  const omegaSI = orbitalOmegaGeom / massToSeconds(totalMassSolar)
  return (2 * omegaSI) / (2 * Math.PI)
}

/**
 * Frecuencia orbital a partir de la separacion, en Hz.
 * f_orb = (1/2pi) sqrt(GM/a^3), con `a` en unidades de la masa total.
 */
export function orbitalFrequencyHz(aGeom: number, totalMassSolar: number): number {
  const omegaGeom = Math.sqrt(1 / (aGeom * aGeom * aGeom))
  return omegaGeom / (2 * Math.PI * massToSeconds(totalMassSolar))
}

/**
 * Ritmo de aumento de la frecuencia gravitacional (el "chirp"):
 *
 *   df/dt = (96/5) pi^{8/3} (G M_c / c^3)^{5/3} f^{11/3}
 *
 * La potencia 11/3 es la firma del inspiral cuadrupolar, y es lo que permite medir
 * la masa de chirp a partir de la sola forma de la senal.
 */
export function chirpRate(fGw: number, m1Solar: number, m2Solar: number): number {
  const mcSec = massToSeconds(chirpMass({ m1: m1Solar, m2: m2Solar }))
  return (96 / 5) * Math.pow(Math.PI, 8 / 3) * Math.pow(mcSec, 5 / 3) * Math.pow(fGw, 11 / 3)
}

/**
 * Tiempo hasta la fusion desde una frecuencia dada, a orden dominante:
 *
 *   tau = (5/256) (pi f)^{-8/3} (G M_c/c^3)^{-5/3}
 */
export function timeToMerger(fGw: number, m1Solar: number, m2Solar: number): number {
  const mcSec = massToSeconds(chirpMass({ m1: m1Solar, m2: m2Solar }))
  return (5 / 256) * Math.pow(Math.PI * fGw, -8 / 3) * Math.pow(mcSec, -5 / 3)
}

export interface Strain {
  /** Polarizacion mas. */
  hPlus: number
  /** Polarizacion cruz. */
  hCross: number
  /** Amplitud caracteristica (sin los factores de inclinacion). */
  amplitude: number
}

/**
 * Amplitud de deformacion en campo lejano:
 *
 *   h = (4/D) (G M_c/c^2)^{5/3} (pi f_gw / c)^{2/3}
 *
 * con las dependencias angulares
 *   h+ = h (1 + cos^2 i)/2 cos(Phi)
 *   hx = h cos(i) sin(Phi)
 *
 * @param fGw frecuencia gravitacional en Hz
 * @param m1Solar,m2Solar masas en masas solares
 * @param distanceMeters distancia al observador
 * @param inclination angulo entre el eje orbital y la linea de vision
 * @param phase fase Phi de la onda
 */
export function strain(
  fGw: number,
  m1Solar: number,
  m2Solar: number,
  distanceMeters: number,
  inclination: number,
  phase: number,
): Strain {
  const mc = chirpMass({ m1: m1Solar, m2: m2Solar })
  const mcMeters = massToMeters(mc)
  const amplitude =
    (4 / distanceMeters) *
    Math.pow(mcMeters, 5 / 3) *
    Math.pow((Math.PI * fGw) / C, 2 / 3)

  const ci = Math.cos(inclination)
  return {
    amplitude,
    hPlus: amplitude * ((1 + ci * ci) / 2) * Math.cos(phase),
    hCross: amplitude * ci * Math.sin(phase),
  }
}

/**
 * Luminosidad en ondas gravitacionales de una orbita circular, en watts:
 *
 *   L = (32/5) (G^4 / c^5) m1^2 m2^2 M / a^5
 *
 * En la fusion de GW150914 el pico supero la potencia luminosa de todas las
 * estrellas del universo observable juntas, unos 3.6e49 W.
 */
export function gwLuminosity(m1Solar: number, m2Solar: number, aMeters: number): number {
  const m1 = m1Solar * M_SUN
  const m2 = m2Solar * M_SUN
  const M = m1 + m2
  return (32 / 5) * (Math.pow(G, 4) / Math.pow(C, 5)) * ((m1 * m1 * m2 * m2 * M) / Math.pow(aMeters, 5))
}

export interface WaveformSample {
  /** Tiempo, en segundos, con el origen en el instante inicial. */
  t: number
  hPlus: number
  hCross: number
  fGw: number
}

/**
 * Genera la forma de onda del inspiral integrando la relacion de chirp desde una
 * frecuencia inicial hasta el corte, que se toma en la frecuencia de la ultima
 * orbita estable de la masa reducida (a = 6M).
 *
 * Es el modelo cuadrupolar de inspiral: NO incluye la fusion ni el ringdown, que
 * requieren relatividad numerica. La interfaz lo declara.
 */
export function inspiralWaveform(
  m1Solar: number,
  m2Solar: number,
  distanceMeters: number,
  inclination: number,
  fStart: number,
  samples = 2048,
): WaveformSample[] {
  const fEnd = mergerFrequency(m1Solar, m2Solar)
  if (!(fEnd > fStart)) return []

  const tTotal = timeToMerger(fStart, m1Solar, m2Solar) - timeToMerger(fEnd, m1Solar, m2Solar)
  const out: WaveformSample[] = []
  let phase = 0
  let f = fStart
  const dt = tTotal / samples

  for (let i = 0; i < samples; i++) {
    const t = i * dt
    const s = strain(f, m1Solar, m2Solar, distanceMeters, inclination, phase)
    out.push({ t, hPlus: s.hPlus, hCross: s.hCross, fGw: f })
    // Integracion de la fase y de la frecuencia (RK2 basta: f varia despacio
    // salvo justo al final).
    const df1 = chirpRate(f, m1Solar, m2Solar)
    const fMid = f + 0.5 * dt * df1
    const df2 = chirpRate(Math.min(fMid, fEnd), m1Solar, m2Solar)
    phase += 2 * Math.PI * (f + 0.5 * dt * df2) * dt
    f = Math.min(f + dt * df2, fEnd)
  }
  return out
}

/**
 * Frecuencia gravitacional de corte del modelo de inspiral: la de la orbita en
 * a = 6M, que es donde la aproximacion post-newtoniana deja de ser defendible.
 *
 * Para GW150914 (36 + 29 M_sol) da unos 65 Hz. El pico observado estuvo cerca de
 * 250 Hz, que corresponde ya a la fusion propiamente dicha: la diferencia es
 * exactamente lo que este modelo NO cubre y hay que decirlo.
 */
export function mergerFrequency(m1Solar: number, m2Solar: number): number {
  return 2 * orbitalFrequencyHz(6, m1Solar + m2Solar)
}
