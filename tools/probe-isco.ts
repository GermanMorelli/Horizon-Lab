/**
 * Sonda: inestabilidad de las orbitas circulares por dentro del ISCO.
 * Uso:  npx vite-node tools/probe-isco.ts
 */

import { circularParticle, particleRHS, traceOrbit } from '../src/physics/orbits'
import { circularOmega, iscoRadius } from '../src/physics/kerrNewman'

const P = { a: 0, q: 0 }
const rIsco = iscoRadius(P, true)
console.log('r_ISCO =', rIsco.toFixed(6))

for (const factor of [1.2, 1.0, 0.9, 0.75, 0.6]) {
  const r = rIsco * factor
  let init
  try {
    init = circularParticle(r, P, true)
  } catch (e) {
    console.log(`\nr = ${r.toFixed(3)} (${factor}x)  -> sin orbita circular: ${e}`)
    continue
  }
  const { y, k } = init
  const d = particleRHS(y, k, P)
  const omegaNum = d[3] / d[0]

  // Frecuencia epiciclica radial: omega_r^2 = omega_phi^2 (1 - 6/r).
  const wr2 = omegaNum * omegaNum * (1 - 6 / r)

  console.log(`\nr = ${r.toFixed(3)} (${factor}x r_ISCO)`)
  console.log(
    `  Omega numerico ${omegaNum.toFixed(6)}  cerrado ${circularOmega(r, P, true).toFixed(6)}`,
  )
  console.log(
    `  omega_r^2 = ${wr2.toExponential(3)}  -> ${wr2 >= 0 ? 'ESTABLE' : 'INESTABLE'}`,
    wr2 < 0 ? `(tiempo de e-plegado ~ ${(1 / Math.sqrt(-wr2)).toFixed(1)})` : '',
  )

  for (const pr of [-0.004, -0.05, +0.004]) {
    const perturbed = [...y] as typeof y
    perturbed[4] = pr
    const res = traceOrbit(perturbed, k, P, { tauMax: 20000, maxSteps: 300_000 })
    console.log(
      `  p_r=${String(pr).padStart(7)}  ->  ${res.outcome.padEnd(9)}` +
        ` pasos ${String(res.steps).padStart(6)}  tau ${res.tau.toFixed(0).padStart(6)}` +
        `  r en [${res.rMin.toFixed(3)}, ${res.rMax.toFixed(3)}]`,
    )
  }
}
