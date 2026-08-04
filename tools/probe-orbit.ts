/**
 * Sonda de diagnostico del trazador de orbitas.
 * Uso:  npx vite-node tools/probe-orbit.ts
 */

import {
  apsidalPhis,
  particleFromLocalVelocity,
  periastronPrecession,
  traceOrbit,
} from '../src/physics/orbits'

const P = { a: 0, q: 0 }

for (const [r0, frac] of [
  [60, 0.985],
  [60, 0.93],
  [40, 0.9],
] as Array<[number, number]>) {
  const vCirc = Math.sqrt(1 / (r0 - 2))
  const { y, k } = particleFromLocalVelocity(r0, Math.PI / 2, [0, 0, vCirc * frac], P)
  const period = 2 * Math.PI * Math.pow(r0, 1.5)

  const t0 = Date.now()
  const res = traceOrbit(y, k, P, { tauMax: 6.5 * period, maxSteps: 300_000 })
  const ms = Date.now() - t0

  // Recorrido explicito: Math.min(...array) desborda la pila con cientos de
  // miles de elementos.
  let crossings = 0
  let prMin = Infinity
  let prMax = -Infinity
  for (let i = 0; i < res.path.length; i++) {
    const v = res.path[i][4]
    if (v < prMin) prMin = v
    if (v > prMax) prMax = v
    if (i > 0 && res.path[i - 1][4] < 0 && v >= 0) crossings++
  }

  const semiLatus = (2 * res.rMin * res.rMax) / (res.rMin + res.rMax)

  console.log(`\n=== r0=${r0}  frac=${frac} ===`)
  console.log({
    ms,
    outcome: res.outcome,
    steps: res.steps,
    tauPedido: (6.5 * period).toFixed(0),
    tauLogrado: res.tau.toFixed(0),
    orbitas: (res.phiTotal / (2 * Math.PI)).toFixed(2),
    rMin: res.rMin.toFixed(4),
    rMax: res.rMax.toFixed(4),
    excentricidad: ((res.rMax - res.rMin) / (res.rMax + res.rMin)).toFixed(4),
    drift: res.maxHamiltonianDrift.toExponential(2),
  })
  console.log({
    pathLen: res.path.length,
    p_rMin: prMin.toExponential(3),
    p_rMax: prMax.toExponential(3),
    crucesNegPos: crossings,
    periastros: apsidalPhis(res, 'peri').length,
    precesion: periastronPrecession(res),
    predicho6piP: (6 * Math.PI) / semiLatus,
  })
}
