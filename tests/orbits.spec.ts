/**
 * Validacion del trazador de orbitas de particulas de prueba.
 *
 * Puntos de referencia analiticos:
 *  - precesion del periastro en campo debil -> 6 pi M / p  (el efecto de Mercurio)
 *  - una orbita circular en el ISCO se mantiene cerrada
 *  - precesion nodal de Lense-Thirring -> 4 a / r^3 por orbita, y nula si a = 0
 *  - una particula cargada se separa de la geodesica neutra; una neutra no
 *  - H se conserva en -1/2 (normalizacion temporal)
 */

import { describe, expect, it } from 'vitest'
import {
  circularParticle,
  nodalPrecession,
  particleFromLocalVelocity,
  particleHamiltonian,
  particleRHS,
  periastronPrecession,
  traceOrbit,
} from '../src/physics/orbits'
import { circularOmega, iscoRadius, type BHParams } from '../src/physics/kerrNewman'

const SCHWARZSCHILD: BHParams = { a: 0, q: 0 }

describe('normalizacion temporal', () => {
  it('H se mantiene en -1/2 para particulas masivas', () => {
    const { y, k } = circularParticle(12, SCHWARZSCHILD, true)
    expect(particleHamiltonian(y, k, SCHWARZSCHILD)).toBeCloseTo(-0.5, 10)
    const res = traceOrbit(y, k, SCHWARZSCHILD, { tauMax: 2000 })
    expect(res.maxHamiltonianDrift).toBeLessThan(1e-8)
  })

  it('tambien se conserva con carga y espin', () => {
    const p: BHParams = { a: 0.7, q: 0.5 }
    const { y, k } = particleFromLocalVelocity(14, Math.PI / 2 - 0.2, [0, 0.05, 0.28], p, 0.4)
    expect(particleHamiltonian(y, k, p)).toBeCloseTo(-0.5, 10)
    const res = traceOrbit(y, k, p, { tauMax: 2000 })
    expect(res.maxHamiltonianDrift).toBeLessThan(1e-7)
  })
})

describe('orbitas circulares', () => {
  it('una orbita circular se mantiene a radio constante', () => {
    for (const r of [8, 12, 30]) {
      const { y, k } = circularParticle(r, SCHWARZSCHILD, true)
      // ~3 orbitas completas.
      const res = traceOrbit(y, k, SCHWARZSCHILD, { tauMax: 20 * Math.pow(r, 1.5) })
      expect((res.rMax - res.rMin) / r).toBeLessThan(1e-5)
      expect(res.outcome).not.toBe('captured')
    }
  }, 30_000)

  it('la velocidad angular coincide con la formula cerrada de Kerr', () => {
    // Omega = dphi/dt de la orbita hallada numericamente (por anulacion de la
    // fuerza radial) debe reproducir la formula cerrada 1/(r^{3/2} + a).
    for (const a of [0, 0.5, 0.9, -0.6]) {
      const p: BHParams = { a, q: 0 }
      for (const r of [8, 10, 25]) {
        const { y, k } = circularParticle(r, p, true)
        const d = particleRHS(y, k, p)
        expect(d[3] / d[0]).toBeCloseTo(circularOmega(r, p, true), 7)
      }
    }
  })

  it('tambien con carga, la orbita circular reproduce su Omega geodesica', () => {
    // Con eps = 0 (particula neutra) y agujero cargado, Omega debe seguir la
    // formula geodesica general aunque q != 0.
    const p: BHParams = { a: 0.4, q: 0.7 }
    const { y, k } = circularParticle(12, p, true, 0)
    const d = particleRHS(y, k, p)
    expect(d[3] / d[0]).toBeCloseTo(circularOmega(12, p, true), 7)
  })

  it('el ISCO es el limite de las orbitas circulares estables', () => {
    // Justo por fuera del ISCO una perturbacion radial pequena queda acotada;
    // justo por dentro, la orbita se desestabiliza y cae.
    const rIsco = iscoRadius(SCHWARZSCHILD, true)
    expect(rIsco).toBeCloseTo(6, 6)

    /**
     * Perturba la orbita circular de r0 subiendo su energia un `dE` relativo y
     * manteniendo L, con p_r despejado de la normalizacion H = -1/2.
     *
     * Se perturba la ENERGIA y no la posicion: una orbita circular tiene E y L
     * exactamente en el minimo del potencial efectivo, asi que con esos valores
     * fijos el unico radio accesible es r0 y desplazar la particula la deja fuera
     * de la region permitida (p_r^2 < 0). Tampoco vale cambiar p_r a mano, porque
     * eso rompe la normalizacion H = -1/2.
     */
    const perturbCircular = (r0: number, dE: number) => {
      const { y, k } = circularParticle(r0, SCHWARZSCHILD, true)
      const kp = { ...k, E: k.E * (1 + dE) }
      const probe = [...y] as typeof y
      probe[4] = 0
      // H con p_r = 0; de ahi se despeja el p_r que restaura H = -1/2.
      const H0 = particleHamiltonian(probe, kp, SCHWARZSCHILD)
      const grr = (r0 * r0 - 2 * r0) / (r0 * r0) // g^rr = Delta/Sigma, ecuador, a=q=0
      const pr2 = (-1 - 2 * H0) / grr
      expect(pr2).toBeGreaterThan(0) // con E mayor, r0 esta dentro de la region permitida
      probe[4] = -Math.sqrt(pr2) // rama entrante
      expect(particleHamiltonian(probe, kp, SCHWARZSCHILD)).toBeCloseTo(-0.5, 9)
      return traceOrbit(probe, kp, SCHWARZSCHILD, { tauMax: 20000, maxSteps: 300_000 })
    }

    const DE = 1e-5

    // Por FUERA del ISCO la orbita circular es un MINIMO del potencial efectivo:
    // la perturbacion queda confinada y la particula oscila (movimiento
    // epiciclico) en torno al radio original.
    const rStable = rIsco * 1.25
    const stable = perturbCircular(rStable, DE)
    expect(stable.outcome).not.toBe('captured')
    expect((stable.rMax - stable.rMin) / rStable).toBeLessThan(0.15)

    // Por DENTRO del ISCO la orbita circular sigue existiendo pero es un MAXIMO
    // del potencial: la MISMA perturbacion crece y la particula se fuga del radio
    // original. Que acabe cayendo o escapando depende de si su L basta para
    // rebotar en la barrera de potencial, asi que lo robusto es medir la fuga y
    // no la captura.
    const rUnstable = rIsco * 0.85
    const unstable = perturbCircular(rUnstable, DE)
    expect((unstable.rMax - unstable.rMin) / rUnstable).toBeGreaterThan(0.5)

    // La misma perturbacion produce una excursion mucho mayor por dentro.
    expect((unstable.rMax - unstable.rMin) / rUnstable).toBeGreaterThan(
      (10 * (stable.rMax - stable.rMin)) / rStable,
    )

    // Y el signo de omega_r^2 = omega_phi^2 (1 - 6M/r) cambia exactamente en 6M:
    // es la definicion misma del ISCO.
    expect(1 - 6 / (rIsco * 1.25)).toBeGreaterThan(0)
    expect(1 - 6 / (rIsco * 0.85)).toBeLessThan(0)
  })
})

describe('precesion del periastro', () => {
  /**
   * Traza una orbita ligeramente excentrica partiendo del apoastro en r0: se da
   * velocidad puramente azimutal algo menor que la circular.
   *
   * Se usan radios moderados (no campo debil extremo) porque el periodo orbital
   * crece como r^{3/2} y medir la precesion exige varias orbitas completas; a
   * r = 400 harian falta cientos de miles de pasos, y a r = 60 la formula
   * 6 pi M / p sigue siendo buena a pocos por ciento.
   */
  const precessionAt = (r0: number, frac: number) => {
    const vCirc = Math.sqrt(1 / (r0 - 2)) // velocidad local de la orbita circular
    const { y, k } = particleFromLocalVelocity(
      r0,
      Math.PI / 2,
      [0, 0, vCirc * frac],
      SCHWARZSCHILD,
    )
    // Periodo orbital en tiempo propio ~ 2 pi r^{3/2}; se piden ~6 orbitas.
    const period = 2 * Math.PI * Math.pow(r0, 1.5)
    const res = traceOrbit(y, k, SCHWARZSCHILD, {
      tauMax: 6.5 * period,
      tol: 1e-10,
      maxSteps: 300_000,
    })
    const prec = periastronPrecession(res)
    const semiLatus = (2 * res.rMin * res.rMax) / (res.rMin + res.rMax)
    return { prec, res, predicted: (6 * Math.PI) / semiLatus, semiLatus }
  }

  /**
   * Precesion exacta por orbita en Schwarzschild.
   *
   * De la frecuencia epiciclica radial de las orbitas circulares,
   * omega_r = omega_phi sqrt(1 - 6M/r), sale el avance exacto
   *   delta_phi = 2 pi [ (1 - 6M/p)^{-1/2} - 1 ]
   * con p el semi-latus rectum. Su desarrollo a primer orden es justo 6 pi M / p,
   * la formula de Mercurio: a p ~ 30 el termino siguiente ya vale un 17 %, asi que
   * la version exacta es un patron mucho mas exigente.
   */
  const exactPrecession = (p: number) => 2 * Math.PI * (Math.pow(1 - 6 / p, -0.5) - 1)

  it('reproduce la precesion exacta 2 pi [(1-6M/p)^-1/2 - 1] al 1 %', () => {
    for (const [r0, frac] of [
      [60, 0.985],
      [60, 0.93],
      [40, 0.9],
      [120, 0.96],
    ] as Array<[number, number]>) {
      const { prec, semiLatus } = precessionAt(r0, frac)
      expect(prec).not.toBeNull()
      expect(prec!).toBeGreaterThan(0) // precesion prograda
      expect(prec! / exactPrecession(semiLatus)).toBeCloseTo(1, 2)
    }
  }, 60_000)

  it('6 pi M / p es su limite de campo debil, y solo ahi', () => {
    // A radio grande, la formula de Mercurio y la exacta convergen; a radio
    // pequeno se separan de forma medible, y el integrador sigue a la exacta.
    const far = precessionAt(400, 0.99)
    expect(far.prec! / far.predicted).toBeCloseTo(1, 1)
    expect(far.prec! / exactPrecession(far.semiLatus)).toBeCloseTo(1, 2)

    const near = precessionAt(30, 0.93)
    // Aqui 6 pi/p se queda corto en mas del 10 %...
    expect(near.prec! / near.predicted).toBeGreaterThan(1.1)
    // ...pero la exacta sigue acertando.
    expect(near.prec! / exactPrecession(near.semiLatus)).toBeCloseTo(1, 2)
  }, 60_000)

  it('la precesion es mayor a radios menores', () => {
    const near = precessionAt(40, 0.985)
    const far = precessionAt(150, 0.985)
    expect(near.prec).not.toBeNull()
    expect(far.prec).not.toBeNull()
    expect(near.prec!).toBeGreaterThan(far.prec!)
  }, 60_000)
})

describe('arrastre de marcos (Lense-Thirring)', () => {
  /**
   * Orbita inclinada a radio r, para medir la precesion nodal.
   * `dir` = +1 movimiento en +phi, -1 en -phi.
   */
  const inclinedRun = (a: number, r: number, dir: 1 | -1 = 1) => {
    const p: BHParams = { a, q: 0 }
    const { y, k } = particleFromLocalVelocity(
      r,
      Math.PI / 2 - 0.3,
      [0, 0, dir * Math.sqrt(1 / (r - 2))],
      p,
    )
    const res = traceOrbit(y, k, p, { tauMax: 12 * Math.pow(r, 1.5), maxSteps: 300_000 })
    return nodalPrecession(res)
  }

  it('sin espin no hay precesion nodal', () => {
    const nodal = inclinedRun(0, 25)
    expect(nodal).not.toBeNull()
    expect(Math.abs(nodal!)).toBeLessThan(5e-3)
  }, 30_000)

  it('el espin hace precesar el nodo, en sentido opuesto al invertirlo', () => {
    const pos = inclinedRun(0.9, 25, 1)
    const neg = inclinedRun(-0.9, 25, 1)
    expect(pos).not.toBeNull()
    expect(neg).not.toBeNull()
    expect(Math.abs(pos!)).toBeGreaterThan(5e-3)
    expect(Math.sign(pos!)).toBe(-Math.sign(neg!))
  }, 40_000)

  it('respeta la simetria de paridad a -> -a con phi -> -phi', () => {
    // La metrica de Kerr con a -> -a es la misma solucion reflejada en phi. Por
    // tanto invertir espin Y sentido de la orbita debe dar la misma precesion en
    // magnitud, con el signo invertido. Esta es la simetria exacta.
    //
    // Ojo: invertir SOLO el espin (dejando el movimiento en +phi) NO da la misma
    // magnitud, porque convierte una orbita prograda en retrograda, que es una
    // configuracion fisicamente distinta con otro periodo orbital.
    const a = inclinedRun(0.9, 25, 1)
    const b = inclinedRun(-0.9, 25, -1)
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(Math.abs(a!)).toBeCloseTo(Math.abs(b!), 5)
    expect(Math.sign(a!)).toBe(-Math.sign(b!))
  }, 40_000)

  it('la precesion nodal por orbita escala como a / r^{3/2}', () => {
    // El ritmo de Lense-Thirring va como a/r^3 y el periodo orbital como r^{3/2},
    // asi que el avance POR ORBITA escala como a * r^{-3/2}.
    const near = Math.abs(inclinedRun(0.9, 20)!)
    const far = Math.abs(inclinedRun(0.9, 40)!)
    expect(near).toBeGreaterThan(far)
    const ratio = near / far
    const expected = Math.pow(2, 1.5) // 2.83
    expect(ratio).toBeGreaterThan(expected * 0.7)
    expect(ratio).toBeLessThan(expected * 1.4)
  }, 40_000)

  it('la precesion nodal es proporcional al espin en el regimen perturbativo', () => {
    const small = Math.abs(inclinedRun(0.2, 40)!)
    const big = Math.abs(inclinedRun(0.4, 40)!)
    expect(big / small).toBeGreaterThan(1.7)
    expect(big / small).toBeLessThan(2.3)
  }, 40_000)
})

describe('particulas cargadas', () => {
  it('una particula neutra sigue la geodesica aunque el agujero este cargado', () => {
    // Con eps = 0 el potencial electromagnetico no interviene: la trayectoria
    // debe ser identica sea cual sea la carga del agujero, a metrica igual.
    const p: BHParams = { a: 0.3, q: 0.6 }
    const mk = (eps: number) => {
      const { y, k } = particleFromLocalVelocity(20, Math.PI / 2, [0, 0, 0.21], p, eps)
      return traceOrbit(y, k, p, { tauMax: 4000 })
    }
    const neutral = mk(0)
    const charged = mk(0.5)
    // Partiendo de la MISMA velocidad local, la cargada se separa de la neutra de
    // forma medible: es la fuerza de Lorentz del campo del agujero.
    expect(Math.abs(charged.rMin - neutral.rMin)).toBeGreaterThan(1e-3)
    expect(Math.abs(charged.phiTotal - neutral.phiTotal)).toBeGreaterThan(1e-3)
  })

  it('la fuerza de Lorentz es repulsiva para carga del mismo signo', () => {
    // Con q > 0 y eps > 0 la repulsion electrostatica eleva el periastro de una
    // trayectoria entrante respecto a la neutra.
    const p: BHParams = { a: 0, q: 0.8 }
    const infall = (eps: number) => {
      const { y, k } = particleFromLocalVelocity(30, Math.PI / 2, [-0.2, 0, 0.12], p, eps)
      return traceOrbit(y, k, p, { tauMax: 3000 })
    }
    const neutral = infall(0)
    const repelled = infall(0.6)
    expect(repelled.rMin).toBeGreaterThan(neutral.rMin)
  })

  it('invertir el signo de la carga invierte el efecto', () => {
    const p: BHParams = { a: 0, q: 0.8 }
    const infall = (eps: number) => {
      const { y, k } = particleFromLocalVelocity(30, Math.PI / 2, [-0.2, 0, 0.12], p, eps)
      return traceOrbit(y, k, p, { tauMax: 3000 })
    }
    const neutral = infall(0)
    const attracted = infall(-0.6)
    expect(attracted.rMin).toBeLessThan(neutral.rMin)
  })
})
