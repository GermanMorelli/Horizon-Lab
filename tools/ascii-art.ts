/**
 * Genera el agujero negro en ASCII del README TRAZANDO GEODESICAS de verdad.
 *
 * No es un dibujo hecho a mano: cada caracter es un rayo integrado con el mismo
 * `traceNullGeodesic` que valida la suite de tests, en la metrica de Kerr. La
 * sombra tiene el tamano que le toca, el disco esta lensado y aparece por encima y
 * por debajo del agujero, y el lado que se acerca sale mas brillante por el
 * corrimiento Doppler, calculado con `redshiftFactor`.
 *
 * Uso:  npx vite-node tools/ascii-art.ts [ancho] [alto]
 */

import { traceNullGeodesic, type RayState } from '../src/physics/geodesic'
import {
  iscoRadius,
  photonMomentumFromDirection,
  redshiftFactor,
  type BHParams,
} from '../src/physics/kerrNewman'

const COLS = Number(process.argv[2] ?? 78)
const ROWS = Number(process.argv[3] ?? 30)

// --- Escena ---------------------------------------------------------------
const BH: BHParams = { a: 0.6, q: 0 }
const CAM_R = 27
const INCLINATION = (80 * Math.PI) / 180 // casi de canto: la vista iconica
const FOV = (56 * Math.PI) / 180
const DISK_OUT = 12
const R_IN = iscoRadius(BH, true)

/**
 * Los caracteres de terminal son aproximadamente el doble de altos que de anchos,
 * asi que la relacion de aspecto se corrige aqui o la imagen sale aplastada.
 */
const CHAR_ASPECT = 2.1

/** Rampa de densidad, de vacio a lleno. */
const RAMP = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@']

const tanHalf = Math.tan(FOV / 2)

/** Traza un pixel y devuelve su brillo en unidades arbitrarias. */
function pixel(ndcX: number, ndcY: number): number {
  // Misma construccion de rayo que el shader: adelante = -e_r, arriba = -e_theta,
  // derecha = +e_phi.
  const dr = -1
  const dth = -ndcY * tanHalf
  const dph = ndcX * tanHalf * CHAR_ASPECT
  const n = Math.hypot(dr, dth, dph)
  const dir: [number, number, number] = [dr / n, dth / n, dph / n]

  const [p_t, p_r, p_th, p_ph] = photonMomentumFromDirection(CAM_R, INCLINATION, dir, BH)
  const E = -p_t
  const L = p_ph
  const y0: RayState = [0, CAM_R, INCLINATION, 0, p_r, p_th]

  let brightness = 0
  let hit = false

  const res = traceNullGeodesic(y0, { E, L }, BH, {
    tol: 1e-7,
    maxSteps: 4000,
    rEscape: 200,
    h0: 0.4,
    stop: (cur, prev) => {
      // Cruce del plano ecuatorial: interpolacion lineal en cos(theta).
      const cPrev = Math.cos(prev[2])
      const cCur = Math.cos(cur[2])
      if (cPrev * cCur >= 0) return false
      const f = cPrev / (cPrev - cCur)
      const r = prev[1] + (cur[1] - prev[1]) * f
      if (r < R_IN || r > DISK_OUT) return false

      // Perfil de Novikov-Thorne, normalizado a su maximo en (49/36) r_in.
      const shape = (rr: number) =>
        Math.pow(rr, -0.75) * Math.pow(Math.max(1 - Math.sqrt(R_IN / rr), 0), 0.25)
      const peak = shape((49 / 36) * R_IN)
      const profile = peak > 0 ? shape(r) / peak : 0

      // Corrimiento total: es lo que hace que un lado brille mas que el otro.
      const g = redshiftFactor(r, E, L, BH, true)
      const boost = Number.isFinite(g) && g > 0 ? g : 0

      brightness = profile * boost
      hit = true
      return true // disco opaco: el primer cruce es el que se ve
    },
  })

  if (hit) return brightness
  // La sombra y el cielo vacio se dejan los dos en blanco: el disco ya dibuja el
  // contorno de la sombra, y un fondo de puntos llena el bloque de ruido sin
  // aportar nada en un README.
  void res
  return 0
}

// --- Render ---------------------------------------------------------------
const grid: number[][] = []
let maxB = 0
for (let row = 0; row < ROWS; row++) {
  const line: number[] = []
  for (let col = 0; col < COLS; col++) {
    const ndcX = (col + 0.5) / COLS * 2 - 1
    const ndcY = 1 - ((row + 0.5) / ROWS) * 2
    const b = pixel(ndcX, ndcY)
    if (b > maxB) maxB = b
    line.push(b)
  }
  grid.push(line)
}

// Compresion tonal suave: sin ella el disco satura y se pierde el degradado.
const out = grid
  .map((line) =>
    line
      .map((b) => {
        const t = Math.pow(Math.min(b / maxB, 1), 0.55)
        const idx = Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1)))
        return RAMP[idx]
      })
      .join('')
      .replace(/\s+$/, ''),
  )
  .join('\n')

// Se recortan las filas y columnas vacias del borde para que la salida se pueda
// pegar directamente en el README sin margenes muertos.
const lines = out.split('\n')
let first = 0
let last = lines.length - 1
while (first < last && lines[first].trim() === '') first++
while (last > first && lines[last].trim() === '') last--
const cropped = lines.slice(first, last + 1)

const minIndent = Math.min(
  ...cropped.filter((l) => l.trim() !== '').map((l) => l.length - l.trimStart().length),
)
console.log(cropped.map((l) => l.slice(minIndent)).join('\n'))
