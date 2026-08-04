/**
 * Presets: objetos reales y casos limite instructivos.
 *
 * Los valores de masa, espin e inclinacion de los objetos reales son los
 * publicados; el espin de Sgr A* y M87* sigue siendo objeto de debate, asi que
 * se toman valores representativos y se indica en la descripcion.
 */

import type { SimParams } from '../state/params'
import { PARSEC } from '../physics/units'

export interface Preset {
  id: string
  name: string
  subtitle: string
  /** Nota que se muestra como aviso informativo al aplicar el preset. */
  info?: string
  params: Partial<SimParams>
}

const deg = (d: number) => (d * Math.PI) / 180

export const PRESETS: Preset[] = [
  {
    id: 'm87',
    name: 'M87*',
    subtitle: '6.5×10⁹ M☉',
    info:
      'Primera imagen de un agujero negro (EHT, 2019). La inclinación de ~17° respecto ' +
      'al eje del chorro hace que la sombra se vea casi circular y el anillo casi uniforme.',
    params: {
      massSolar: 6.5e9,
      spin: 0.9,
      charge: 0,
      inclination: deg(163),
      distanceRg: 55,
      fov: deg(40),
      distanceMeters: 16.8e6 * PARSEC,
      diskOuter: 18,
      eddingtonRatio: 1e-5,
      timeWarp: 1,
    },
  },
  {
    id: 'sgra',
    name: 'Sgr A*',
    subtitle: '4.3×10⁶ M☉',
    info:
      'El agujero negro del centro de la Vía Láctea (EHT, 2022). Visto casi de frente al ' +
      'eje, a 8.2 kpc. Su periodo orbital en el ISCO es de ~30 min: es el único cuyo disco ' +
      'varía en escalas de tiempo humanas.',
    params: {
      massSolar: 4.3e6,
      spin: 0.94,
      charge: 0,
      inclination: deg(30),
      distanceRg: 52,
      fov: deg(40),
      distanceMeters: 8.2e3 * PARSEC,
      diskOuter: 16,
      eddingtonRatio: 1e-8,
      timeWarp: 1,
    },
  },
  {
    id: 'cygx1',
    name: 'Cygnus X-1',
    subtitle: '21 M☉',
    info:
      'Agujero negro estelar en un sistema binario, con espín casi extremal (a/M > 0.95) ' +
      'y disco a ~10⁷ K: emite sobre todo en rayos X. En la banda visible el brillo ' +
      'superficial es alto pero la cromaticidad ya está saturada en blanco-azul.',
    params: {
      massSolar: 21,
      spin: 0.97,
      charge: 0,
      inclination: deg(63),
      distanceRg: 50,
      fov: deg(40),
      distanceMeters: 2.22e3 * PARSEC,
      diskOuter: 18,
      eddingtonRatio: 0.02,
      timeWarp: 1,
    },
  },
  {
    id: 'kerr-extremal',
    name: 'Kerr extremal',
    subtitle: 'a/M = 0.998',
    info:
      'Límite de Thorne: el máximo espín alcanzable por acreción astrofísica. La sombra ' +
      'muestra su borde plano característico del lado prógrado, el ISCO baja a ~1.24 M y ' +
      'la eficiencia de acreción supera el 30%.',
    params: {
      massSolar: 1e7,
      spin: 0.998,
      charge: 0,
      inclination: deg(85),
      distanceRg: 50,
      fov: deg(40),
      diskOuter: 16,
      showErgosphere: true,
      layerOpacity: 0.7,
    },
  },
  {
    id: 'reissner',
    name: 'Reissner-Nordström',
    subtitle: 'a = 0, Q/M = 0.9',
    info:
      'Sin espín y con carga: solución estática y esféricamente simétrica. La sombra es ' +
      'circular pero más pequeña que la de Schwarzschild, porque la carga contrae los ' +
      'horizontes. No es astrofísico (el plasma neutraliza la carga), pero es exacto.',
    params: {
      massSolar: 1e7,
      spin: 0,
      charge: 0.9,
      inclination: deg(80),
      distanceRg: 55,
      fov: deg(40),
      diskOuter: 18,
      showHorizon: true,
      showPhotonSphere: true,
      layerOpacity: 0.7,
    },
  },
  {
    id: 'schwarzschild',
    name: 'Schwarzschild',
    subtitle: 'a = 0, Q = 0',
    info:
      'El caso más simple: sombra circular de radio exactamente √27 M = 5.196 M, esfera ' +
      'de fotones en 3 M, ISCO en 6 M. Es el caso contra el que se valida el trazador.',
    params: {
      massSolar: 1e7,
      spin: 0,
      charge: 0,
      inclination: deg(84),
      distanceRg: 58,
      fov: deg(40),
      diskOuter: 20,
      showPhotonSphere: true,
      showIsco: true,
      layerOpacity: 0.7,
    },
  },
  {
    id: 'kerr-newman',
    name: 'Kerr-Newman',
    subtitle: 'a=0.7, Q=0.6',
    info:
      'La solución general: espín y carga a la vez, con a² + q² = 0.85 cerca del límite ' +
      'extremal. Es el caso que da nombre al simulador.',
    params: {
      massSolar: 1e8,
      spin: 0.7,
      charge: 0.6,
      inclination: deg(78),
      distanceRg: 48,
      fov: deg(40),
      diskOuter: 15,
      showErgosphere: true,
      showPhotonSphere: true,
      layerOpacity: 0.7,
    },
  },
  {
    id: 'naked',
    name: 'Singularidad desnuda',
    subtitle: 'a² + q² > 1',
    info:
      'Régimen sin horizonte: a² + q² > 1. Es matemáticamente una solución válida de las ' +
      'ecuaciones de Einstein-Maxwell, pero viola la conjetura de censura cósmica y no se ' +
      'espera que exista. Sin horizonte no hay sombra: los rayos atraviesan la región central.',
    params: {
      massSolar: 1e7,
      spin: 0.9,
      charge: 0.75,
      inclination: deg(80),
      distanceRg: 50,
      fov: deg(40),
      diskOuter: 16,
      diskEnabled: true,
      starsEnabled: true,
    },
  },
]

export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
