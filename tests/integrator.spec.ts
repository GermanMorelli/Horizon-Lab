/**
 * Calidad numerica del integrador de geodesicas.
 *
 * Los tests de `physics.spec.ts` verifican la GEOMETRIA contra formulas cerradas.
 * Estos verifican que el INTEGRADOR sigue esa geometria sin derivar: conservacion
 * del hamiltoniano (que debe ser exactamente 0 para rayos nulos), conservacion de
 * la constante de Carter, orden de convergencia y estabilidad junto al horizonte.
 */

import { describe, expect, it } from 'vitest'
import {
  carterConstant,
  equatorialInboundRay,
  hamiltonian,
  nullGeodesicRHS,
  traceNullGeodesic,
  type RayState,
} from '../src/physics/geodesic'
import {
  horizons,
  photonCircularRadius,
  photonMomentumFromDirection,
  type BHParams,
} from '../src/physics/kerrNewman'
import {
  criticalImpactParameterStatic,
  criticalImpactParams,
} from '../src/physics/shadowRim'

/** Construye un rayo desde una camara ZAMO apuntando en una direccion local. */
function rayFromCamera(
  r: number,
  theta: number,
  dir: [number, number, number],
  p: BHParams,
): { y: RayState; k: { E: number; L: number } } {
  const n = Math.hypot(...dir)
  const unit: [number, number, number] = [dir[0] / n, dir[1] / n, dir[2] / n]
  const [p_t, p_r, p_th, p_ph] = photonMomentumFromDirection(r, theta, unit, p)
  return { y: [0, r, theta, 0, p_r, p_th], k: { E: -p_t, L: p_ph } }
}

describe('conservacion de invariantes', () => {
  it('H se mantiene en 0 a lo largo de una travesia completa (Kerr-Newman)', () => {
    const p: BHParams = { a: 0.9, q: 0.35 }
    const cases: Array<[number, number, [number, number, number]]> = [
      [30, Math.PI / 2, [-1, 0, 0.14]],
      [30, Math.PI / 2, [-1, 0, 0.18]],
      [20, 1.1, [-1, 0.05, 0.2]],
      [50, 0.6, [-1, -0.03, 0.09]],
    ]
    for (const [r0, th0, dir] of cases) {
      const { y, k } = rayFromCamera(r0, th0, dir, p)
      const res = traceNullGeodesic(y, k, p, { tol: 1e-11, maxSteps: 200_000, rEscape: 1e4 })
      // El hamiltoniano de un rayo nulo es identicamente 0; E^2 fija la escala.
      expect(res.maxHamiltonianDrift / (k.E * k.E)).toBeLessThan(1e-9)
    }
  })

  it('la constante de Carter se conserva con deriva relativa < 1e-8', () => {
    const p: BHParams = { a: 0.85, q: 0.2 }
    const { y, k } = rayFromCamera(25, 1.0, [-1, 0.3, 0.25], p)
    const res = traceNullGeodesic(y, k, p, { tol: 1e-11, maxSteps: 200_000, rEscape: 1e4 })
    expect(res.maxCarterDrift).toBeLessThan(1e-8)
  })

  it('E y L son exactamente constantes (no se integran)', () => {
    // Se comprueba que el RHS no tiene componentes para p_t ni p_phi:
    // el sistema reducido tiene 6 componentes y ninguna es dE/dl o dL/dl.
    const p: BHParams = { a: 0.6, q: 0.4 }
    const { y, k } = rayFromCamera(15, 1.3, [-1, 0.2, 0.4], p)
    const d = nullGeodesicRHS(y, k, p)
    expect(d).toHaveLength(6)
    // Y tras integrar, recomputar H con las mismas E, L sigue dando ~0.
    const res = traceNullGeodesic(y, k, p, { tol: 1e-11, rEscape: 1e4 })
    expect(Math.abs(hamiltonian(res.y, k, p))).toBeLessThan(1e-9)
  })

  it('la constante de Carter se anula para rayos ecuatoriales', () => {
    const p: BHParams = { a: 0.7, q: 0.3 }
    const { y, k } = equatorialInboundRay(100, 8, p)
    expect(Math.abs(carterConstant(y, k, p))).toBeLessThan(1e-20)
    // Y el rayo permanece en el plano ecuatorial.
    const res = traceNullGeodesic(y, k, p, { tol: 1e-11, rEscape: 200 })
    expect(Math.abs(res.y[2] - Math.PI / 2)).toBeLessThan(1e-12)
  })
})

describe('orden de convergencia', () => {
  it('reducir la tolerancia reduce la deriva de H de forma consistente', () => {
    const p: BHParams = { a: 0.8, q: 0.3 }
    const drifts: number[] = []
    for (const tol of [1e-6, 1e-8, 1e-10]) {
      const { y, k } = rayFromCamera(30, Math.PI / 2, [-1, 0, 0.15], p)
      const res = traceNullGeodesic(y, k, p, { tol, maxSteps: 500_000, rEscape: 1e4 })
      drifts.push(res.maxHamiltonianDrift)
    }
    // Monotona decreciente y con mejora sustancial en cada escalon.
    expect(drifts[1]).toBeLessThan(drifts[0])
    expect(drifts[2]).toBeLessThan(drifts[1])
    expect(drifts[0] / drifts[2]).toBeGreaterThan(50)
  })

  it('la posicion final converge al refinar la tolerancia', () => {
    const p: BHParams = { a: 0.5, q: 0.2 }
    const dirs: Array<[number, number, number]> = []
    for (const tol of [1e-7, 1e-9, 1e-11]) {
      const { y, k } = rayFromCamera(40, 1.2, [-1, 0.02, 0.12], p)
      const res = traceNullGeodesic(y, k, p, { tol, maxSteps: 500_000, rEscape: 1e4 })
      expect(res.outcome).toBe('escaped')
      dirs.push(res.skyDir!)
    }
    const d01 = Math.hypot(dirs[0][0] - dirs[1][0], dirs[0][1] - dirs[1][1], dirs[0][2] - dirs[1][2])
    const d12 = Math.hypot(dirs[1][0] - dirs[2][0], dirs[1][1] - dirs[2][1], dirs[1][2] - dirs[2][2])
    expect(d12).toBeLessThan(d01)
    expect(d12).toBeLessThan(1e-7)
  })
})

describe('estabilidad junto al horizonte', () => {
  it('ningun paso cruza r+ antes de declarar captura', () => {
    const p: BHParams = { a: 0.95, q: 0.2 }
    const rPlus = horizons(p).rPlus
    const { y, k } = rayFromCamera(20, Math.PI / 2, [-1, 0, 0.02], p)
    let minR = Infinity
    const res = traceNullGeodesic(y, k, p, {
      tol: 1e-10,
      maxSteps: 500_000,
      stop: (s) => {
        minR = Math.min(minR, s[1])
        return false
      },
    })
    expect(res.outcome).toBe('captured')
    // El limitador de paso garantiza que r nunca baja del radio de captura.
    expect(minR).toBeGreaterThan(rPlus)
  })

  it('rayos casi extremales (a^2+q^2 -> 1) siguen siendo estables', () => {
    const p: BHParams = { a: 0.97, q: 0.24 } // a^2+q^2 = 0.9985
    expect(horizons(p).hasHorizon).toBe(true)
    const { y, k } = rayFromCamera(25, 1.4, [-1, 0.1, 0.08], p)
    const res = traceNullGeodesic(y, k, p, { tol: 1e-10, maxSteps: 500_000, rEscape: 1e4 })
    expect(['captured', 'escaped']).toContain(res.outcome)
    expect(Number.isFinite(res.y[1])).toBe(true)
    expect(res.maxHamiltonianDrift / (k.E * k.E)).toBeLessThan(1e-7)
  })
})

describe('el trazador reproduce la sombra', () => {
  const R0 = 1e4

  /** Traza un rayo ecuatorial entrante con parametro de impacto b. */
  const shoot = (b: number, p: BHParams) => {
    const { y, k } = equatorialInboundRay(R0, b, p)
    return traceNullGeodesic(y, k, p, { tol: 1e-12, maxSteps: 500_000, rEscape: R0 * 2 })
  }

  /**
   * Umbral de captura por biseccion sobre |b|, con el signo fijando el sentido
   * respecto al espin. Es el borde de la sombra medido por el integrador.
   */
  const captureThreshold = (sign: 1 | -1, p: BHParams): number => {
    let lo = 0.5 // capturado
    let hi = 12 // escapa
    for (let i = 0; i < 50; i++) {
      const mid = 0.5 * (lo + hi)
      if (shoot(sign * mid, p).outcome === 'captured') lo = mid
      else hi = mid
    }
    return 0.5 * (lo + hi)
  }

  it('el parametro de impacto critico separa captura de escape (Schwarzschild)', () => {
    const p: BHParams = { a: 0, q: 0 }
    const bc = criticalImpactParameterStatic(p) // sqrt(27)
    expect(shoot(bc * 0.999, p).outcome).toBe('captured')
    expect(shoot(bc * 1.001, p).outcome).toBe('escaped')
  })

  it('el umbral medido por el integrador es sqrt(27) con 4 digitos', () => {
    expect(captureThreshold(1, { a: 0, q: 0 })).toBeCloseTo(Math.sqrt(27), 4)
  })

  it('el mismo umbral funciona con carga (RN extremal, b_c = 4)', () => {
    const p: BHParams = { a: 0, q: 1 }
    expect(criticalImpactParameterStatic(p)).toBeCloseTo(4, 8)
    expect(shoot(3.98, p).outcome).toBe('captured')
    expect(shoot(4.02, p).outcome).toBe('escaped')
    expect(captureThreshold(1, p)).toBeCloseTo(4, 4)
  })

  it('el umbral de captura de Kerr es asimetrico entre prograde y retrograde', () => {
    // Un rayo que gira en el sentido del espin puede acercarse mas antes de caer:
    // de ahi el borde plano de la sombra del lado prograde.
    const p: BHParams = { a: 0.9, q: 0 }
    const bPro = captureThreshold(1, p)
    const bRetro = captureThreshold(-1, p)
    expect(bRetro).toBeGreaterThan(bPro)

    // Referencia independiente: xi evaluado en la orbita ecuatorial de fotones,
    // calculado por el modulo analitico de Bardeen (no comparte codigo con el
    // integrador). Ahi eta = 0, que es la condicion de rayo ecuatorial.
    const xiPro = criticalImpactParams(photonCircularRadius(p, true), p)
    const xiRetro = criticalImpactParams(photonCircularRadius(p, false), p)
    expect(Math.abs(xiPro.eta)).toBeLessThan(1e-6)
    expect(Math.abs(xiRetro.eta)).toBeLessThan(1e-6)
    expect(bPro).toBeCloseTo(Math.abs(xiPro.xi), 3)
    expect(bRetro).toBeCloseTo(Math.abs(xiRetro.xi), 3)
  })

  it('el umbral con espin y carga combinados sigue a la curva analitica', () => {
    const p: BHParams = { a: 0.6, q: 0.5 }
    const bPro = captureThreshold(1, p)
    const xiPro = criticalImpactParams(photonCircularRadius(p, true), p)
    expect(bPro).toBeCloseTo(Math.abs(xiPro.xi), 3)
  })
})
