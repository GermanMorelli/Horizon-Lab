/**
 * Dinamica orbital post-newtoniana con reaccion de radiacion.
 *
 * Las posiciones de las dos punturas de `binary.ts` las dicta este modulo, no las
 * ecuaciones de Einstein: la metrica de Brill-Lindquist es una instantanea de
 * datos iniciales y no evoluciona por si sola. Esta es la separacion honesta de
 * responsabilidades del modelo, y esta declarada como tal en la interfaz.
 *
 * Lo que si es riguroso es la propia dinamica. Las ecuaciones de Peters (1964)
 * para el decaimiento orbital por emision de ondas gravitacionales son estandar y
 * se validan contra una medida real: el pulsar binario de Hulse-Taylor
 * (PSR B1913+16) tiene un decaimiento orbital medido de -2.4025e-12 s/s, y estas
 * formulas lo reproducen. Ese acuerdo fue el Nobel de 1993.
 *
 * Unidades: geometrizadas, G = c = 1, masas y longitudes en unidades de la masa
 * total M = m1 + m2 salvo donde se indique lo contrario.
 */

import { C, GM_SUN } from './units'

export interface BinaryOrbit {
  /** Masa del primer cuerpo, en unidades de la masa total. */
  m1: number
  /** Masa del segundo cuerpo, en unidades de la masa total. */
  m2: number
  /** Semieje mayor, en unidades de la masa total. */
  a: number
  /** Excentricidad. */
  e: number
  /** Anomalia verdadera (fase orbital), en radianes. */
  nu: number
}

// ---------------------------------------------------------------------------
// Cantidades derivadas
// ---------------------------------------------------------------------------

/** Masa total. */
export function totalMass(o: Pick<BinaryOrbit, 'm1' | 'm2'>): number {
  return o.m1 + o.m2
}

/** Masa reducida mu = m1 m2 / M. */
export function reducedMass(o: Pick<BinaryOrbit, 'm1' | 'm2'>): number {
  return (o.m1 * o.m2) / (o.m1 + o.m2)
}

/** Razon de masa simetrica eta = mu/M, en (0, 1/4]. Vale 1/4 si m1 = m2. */
export function symmetricMassRatio(o: Pick<BinaryOrbit, 'm1' | 'm2'>): number {
  const M = o.m1 + o.m2
  return (o.m1 * o.m2) / (M * M)
}

/**
 * Masa de chirp M_c = (m1 m2)^{3/5} / (m1 + m2)^{1/5}.
 * Es el unico parametro de masa que determina el inspiral a orden dominante, y por
 * eso es lo primero que miden los detectores de ondas gravitacionales.
 */
export function chirpMass(o: Pick<BinaryOrbit, 'm1' | 'm2'>): number {
  return Math.pow(o.m1 * o.m2, 0.6) / Math.pow(o.m1 + o.m2, 0.2)
}

/** Frecuencia orbital kepleriana: Omega = sqrt(M/a^3). */
export function orbitalOmega(o: BinaryOrbit): number {
  return Math.sqrt(totalMass(o) / (o.a * o.a * o.a))
}

/** Periodo orbital P = 2 pi sqrt(a^3/M). */
export function orbitalPeriod(o: BinaryOrbit): number {
  return 2 * Math.PI * Math.sqrt((o.a * o.a * o.a) / totalMass(o))
}

/** Separacion instantanea r = a(1-e^2)/(1 + e cos nu). */
export function separation(o: BinaryOrbit): number {
  return (o.a * (1 - o.e * o.e)) / (1 + o.e * Math.cos(o.nu));
}

/**
 * Posiciones de los dos cuerpos en el plano orbital, respecto al centro de masas.
 * Devuelve coordenadas cartesianas con z = 0 (el plano orbital es z = 0).
 */
export function bodyPositions(
  o: BinaryOrbit,
): { p1: [number, number, number]; p2: [number, number, number] } {
  const r = separation(o)
  const M = totalMass(o)
  const x = r * Math.cos(o.nu)
  const y = r * Math.sin(o.nu)
  // El centro de masas esta en el origen: m1 r1 = -m2 r2.
  const f1 = -o.m2 / M
  const f2 = o.m1 / M
  return {
    p1: [f1 * x, f1 * y, 0],
    p2: [f2 * x, f2 * y, 0],
  }
}

// ---------------------------------------------------------------------------
// Reaccion de radiacion: ecuaciones de Peters (1964)
// ---------------------------------------------------------------------------

/**
 * da/dt promediada sobre una orbita:
 *
 *   da/dt = -(64/5) (m1 m2 M / a^3) (1 - e^2)^{-7/2} (1 + 73e^2/24 + 37e^4/96)
 *
 * En unidades geometrizadas. La dependencia (1-e^2)^{-7/2} es la razon de que las
 * orbitas excentricas radien mucho mas: el paso por el periastro domina.
 */
export function dadt(o: BinaryOrbit): number {
  const M = totalMass(o)
  const e2 = o.e * o.e
  const oneMinus = Math.max(1 - e2, 1e-12)
  const enhance = 1 + (73 * e2) / 24 + (37 * e2 * e2) / 96
  return (
    (-64 / 5) *
    ((o.m1 * o.m2 * M) / Math.pow(o.a, 3)) *
    Math.pow(oneMinus, -3.5) *
    enhance
  )
}

/**
 * de/dt promediada sobre una orbita:
 *
 *   de/dt = -(304/15) e (m1 m2 M / a^4) (1 - e^2)^{-5/2} (1 + 121e^2/304)
 *
 * Es negativa siempre: la radiacion circulariza la orbita. Por eso se espera que
 * las binarias lleguen a la fusion practicamente circulares.
 */
export function dedt(o: BinaryOrbit): number {
  const M = totalMass(o)
  const e2 = o.e * o.e
  const oneMinus = Math.max(1 - e2, 1e-12)
  return (
    (-304 / 15) *
    o.e *
    ((o.m1 * o.m2 * M) / Math.pow(o.a, 4)) *
    Math.pow(oneMinus, -2.5) *
    (1 + (121 * e2) / 304)
  )
}

/**
 * Tiempo de coalescencia de una orbita CIRCULAR, en forma cerrada:
 *
 *   t_c = (5/256) a^4 / (m1 m2 M)
 *
 * Sale de integrar da/dt con e = 0. Se usa como referencia de los tests y para
 * mostrar en la interfaz cuanto le queda a la binaria.
 */
export function coalescenceTimeCircular(o: Pick<BinaryOrbit, 'm1' | 'm2' | 'a'>): number {
  const M = o.m1 + o.m2
  return (5 / 256) * Math.pow(o.a, 4) / (o.m1 * o.m2 * M)
}

/**
 * Tiempo de coalescencia con excentricidad, por la aproximacion de Peters:
 * el factor de correccion respecto al caso circular es aproximadamente
 * (1 - e^2)^{7/2}, que para e = 0.6 acorta la vida en un factor ~9.
 */
export function coalescenceTime(o: BinaryOrbit): number {
  return coalescenceTimeCircular(o) * Math.pow(Math.max(1 - o.e * o.e, 1e-12), 3.5)
}

/**
 * Avanza la orbita un intervalo de tiempo coordenado `dt` con Runge-Kutta 4 sobre
 * (a, e), y avanza la fase orbital con la Omega kepleriana instantanea.
 *
 * Devuelve la orbita nueva y si ha alcanzado la fusion. El criterio de fusion es
 * a <= a_merge, con a_merge la separacion a la que la aproximacion post-newtoniana
 * deja de ser defendible (del orden de unas pocas masas totales); se toma el ISCO
 * de la masa reducida, 6M, como umbral, y se declara como limite del modelo.
 */
export const A_MERGE = 6

export function stepOrbit(o: BinaryOrbit, dt: number): { orbit: BinaryOrbit; merged: boolean } {
  if (o.a <= A_MERGE) return { orbit: o, merged: true }

  const deriv = (s: BinaryOrbit) => ({ da: dadt(s), de: dedt(s) })
  const at = (s: BinaryOrbit, h: number, d: { da: number; de: number }): BinaryOrbit => ({
    ...s,
    a: Math.max(s.a + h * d.da, A_MERGE * 0.5),
    e: Math.min(Math.max(s.e + h * d.de, 0), 0.999),
  })

  const k1 = deriv(o)
  const k2 = deriv(at(o, dt / 2, k1))
  const k3 = deriv(at(o, dt / 2, k2))
  const k4 = deriv(at(o, dt, k3))

  const a = o.a + (dt / 6) * (k1.da + 2 * k2.da + 2 * k3.da + k4.da)
  const e = o.e + (dt / 6) * (k1.de + 2 * k2.de + 2 * k3.de + k4.de)

  // La fase avanza con la velocidad angular instantanea en la separacion actual
  // (no con la media orbital), para que la animacion sea fiel en orbitas excentricas.
  const r = separation(o)
  const L = Math.sqrt(totalMass(o) * o.a * Math.max(1 - o.e * o.e, 1e-12))
  const dnu = (L / (r * r)) * dt

  const next: BinaryOrbit = {
    m1: o.m1,
    m2: o.m2,
    a: Math.max(a, A_MERGE * 0.5),
    e: Math.min(Math.max(e, 0), 0.999),
    nu: o.nu + dnu,
  }
  return { orbit: next, merged: next.a <= A_MERGE }
}

// ---------------------------------------------------------------------------
// Conversion a unidades fisicas
// ---------------------------------------------------------------------------

/**
 * GM/c^3 en segundos para una masa en masas solares: 4.92549e-6 s por M_sol.
 * Usa el parametro GM_SUN nominal, no G * M_SUN; ver la nota en units.ts.
 */
export function massToSeconds(massSolar: number): number {
  return (GM_SUN * massSolar) / (C * C * C)
}

/** GM/c^2 en metros para una masa en masas solares: 1476.6 m por M_sol. */
export function massToMeters(massSolar: number): number {
  return (GM_SUN * massSolar) / (C * C)
}

/**
 * Decaimiento del periodo orbital dP/dt, adimensional (s/s), en unidades fisicas.
 *
 *   dP/dt = -(192 pi/5) (2 pi/P)^{5/3} (G M_c/c^3)^{5/3} (1-e^2)^{-7/2}
 *           (1 + 73e^2/24 + 37e^4/96)
 *
 * Es la magnitud que se mide en los pulsares binarios. Para PSR B1913+16 debe dar
 * -2.40e-12, que es el resultado historico de Hulse y Taylor.
 *
 * @param m1Solar masa del primer cuerpo en masas solares
 * @param m2Solar masa del segundo cuerpo en masas solares
 * @param periodSeconds periodo orbital en segundos
 * @param e excentricidad
 */
export function orbitalPeriodDecay(
  m1Solar: number,
  m2Solar: number,
  periodSeconds: number,
  e: number,
): number {
  const mc = chirpMass({ m1: m1Solar, m2: m2Solar })
  const mcSec = massToSeconds(mc) // G M_c / c^3, en segundos
  const e2 = e * e
  const enhance = 1 + (73 * e2) / 24 + (37 * e2 * e2) / 96
  return (
    (-192 * Math.PI / 5) *
    Math.pow((2 * Math.PI) / periodSeconds, 5 / 3) *
    Math.pow(mcSec, 5 / 3) *
    Math.pow(1 - e2, -3.5) *
    enhance
  )
}
