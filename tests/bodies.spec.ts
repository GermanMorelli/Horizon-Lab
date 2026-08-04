/**
 * Validacion de los cuerpos de prueba: radio de marea, tamano angular y la
 * animacion con los dos relojes.
 */

import { describe, expect, it } from 'vitest'
import {
  BODY_CATALOG,
  M_EARTH_SOLAR,
  R_SUN,
  angularRadiusRad,
  bodyRadiusRg,
  massRatio,
  surfaceEscapeVelocity,
  tidalRadiusMeters,
  tidalRadiusRg,
  tidalVerdict,
  TEST_PARTICLE_LIMIT,
} from '../src/physics/bodies'
import {
  circularParticle,
  findFirstCrossing,
  pathDuration,
  particleFromLocalVelocity,
  sampleAt,
  traceOrbit,
} from '../src/physics/orbits'
import { horizons, type BHParams } from '../src/physics/kerrNewman'
import { gravitationalRadius } from '../src/physics/units'

const SCHW: BHParams = { a: 0, q: 0 }

describe('radio de marea', () => {
  it('escala como R (M_BH/m)^{1/3}', () => {
    const sun = BODY_CATALOG.sun
    // Duplicar la masa del agujero multiplica r_t por 2^{1/3}.
    const a = tidalRadiusMeters(sun, 1e6)
    const b = tidalRadiusMeters(sun, 2e6)
    expect(b / a).toBeCloseTo(Math.cbrt(2), 10)
  })

  it('el Sol se rompe a ~47 r_g de un agujero de 10^6 masas solares', () => {
    // r_t = R_sol (10^6)^{1/3} = 6.957e8 * 100 = 6.957e10 m
    // r_g = 1.4766e3 * 1e6 = 1.4766e9 m  ->  r_t/r_g = 47.1
    const rt = tidalRadiusRg(BODY_CATALOG.sun, 1e6)
    expect(rt).toBeGreaterThan(45)
    expect(rt).toBeLessThan(49)
    // Y en metros coincide con el calculo directo.
    expect(tidalRadiusMeters(BODY_CATALOG.sun, 1e6)).toBeCloseTo(R_SUN * 100, -7)
  })

  it('en un agujero supermasivo el radio de marea cae DENTRO del horizonte', () => {
    // Es el resultado contraintuitivo: r_t/r_g ~ M_BH^{-2/3}, asi que crece al
    // DISMINUIR la masa del agujero. Alrededor de M87* una estrella cae entera.
    const rt = tidalRadiusRg(BODY_CATALOG.sun, 6.5e9)
    expect(rt).toBeLessThan(0.2)
    // El horizonte de Schwarzschild esta en 2 r_g: el radio de marea queda dentro.
    expect(rt).toBeLessThan(2)
  })

  it('r_t/r_g decrece con la masa del agujero como M^{-2/3}', () => {
    const a = tidalRadiusRg(BODY_CATALOG.sun, 1e6)
    const b = tidalRadiusRg(BODY_CATALOG.sun, 8e6)
    // Multiplicar la masa por 8 divide r_t/r_g por 8^{2/3} = 4.
    expect(a / b).toBeCloseTo(4, 6)
  })

  it('un cuerpo mas denso resiste mas cerca', () => {
    // Una enana blanca es mucho mas densa que el Sol, asi que su radio de marea es
    // mucho menor: sobrevive mas adentro.
    const sun = tidalRadiusRg(BODY_CATALOG.sun, 1e6)
    const wd = tidalRadiusRg(BODY_CATALOG.whiteDwarf, 1e6)
    const ns = tidalRadiusRg(BODY_CATALOG.neutronStar, 1e6)
    expect(wd).toBeLessThan(sun)
    expect(ns).toBeLessThan(wd)
  })

  it('una gigante roja se rompe muy lejos', () => {
    const giant = tidalRadiusRg(BODY_CATALOG.redGiant, 1e6)
    const sun = tidalRadiusRg(BODY_CATALOG.sun, 1e6)
    // Radio 100 veces mayor con masa parecida: el radio de marea sube casi x100.
    expect(giant / sun).toBeGreaterThan(50)
  })

  it('el dictamen distingue romperse de caer entero', () => {
    const h = horizons(SCHW).rPlus // 2 r_g

    // Agujero de masa intermedia: la estrella se rompe fuera del horizonte.
    const stellar = tidalVerdict(BODY_CATALOG.sun, 1e6, h, 10)
    expect(stellar.swallowedWhole).toBe(false)
    expect(stellar.disrupts).toBe(true)

    // Supermasivo: r_t dentro del horizonte, cae entera.
    const smbh = tidalVerdict(BODY_CATALOG.sun, 6.5e9, h, 3)
    expect(smbh.swallowedWhole).toBe(true)
    expect(smbh.disrupts).toBe(false)

    // Orbita lejana: no llega al radio de marea.
    const safe = tidalVerdict(BODY_CATALOG.sun, 1e6, h, 500)
    expect(safe.reachesTidalRadius).toBe(false)
    expect(safe.disrupts).toBe(false)
  })

  it('la velocidad de escape superficial ordena la resistencia a las mareas', () => {
    // Es la autogravedad que las mareas deben vencer, y ordena igual que r_t.
    const vSun = surfaceEscapeVelocity(BODY_CATALOG.sun)
    const vNs = surfaceEscapeVelocity(BODY_CATALOG.neutronStar)
    expect(vSun).toBeGreaterThan(6e5) // ~618 km/s
    expect(vSun).toBeLessThan(7e5)
    // La estrella de neutrones escapa a una fraccion notable de c.
    expect(vNs / 2.998e8).toBeGreaterThan(0.4)
  })
})

describe('tamano angular y escala', () => {
  it('el radio angular decrece como 1/distancia', () => {
    const a = angularRadiusRad(BODY_CATALOG.sun, 1e6, 100)
    const b = angularRadiusRad(BODY_CATALOG.sun, 1e6, 200)
    expect(a / b).toBeCloseTo(2, 4)
  })

  it('el radio del cuerpo en r_g coincide con el calculo directo', () => {
    const rg = gravitationalRadius(1e6)
    expect(bodyRadiusRg(BODY_CATALOG.sun, 1e6)).toBeCloseTo(R_SUN / rg, 6)
  })

  it('una estrella es enorme frente a un agujero estelar y diminuta frente a uno supermasivo', () => {
    // Alrededor de un agujero de 10 masas solares, el Sol mide 47000 r_g: no cabe.
    expect(bodyRadiusRg(BODY_CATALOG.sun, 10)).toBeGreaterThan(1e4)
    // Alrededor de M87*, mide 7e-5 r_g: un punto.
    expect(bodyRadiusRg(BODY_CATALOG.sun, 6.5e9)).toBeLessThan(1e-3)
  })

  it('la razon de masas respeta el limite de particula de prueba', () => {
    // La Tierra alrededor de cualquier agujero razonable es una particula de prueba.
    expect(massRatio(BODY_CATALOG.earth, 1e6)).toBeLessThan(TEST_PARTICLE_LIMIT)
    // Pero una gigante azul alrededor de un agujero de 10 masas solares NO lo es:
    // ahi la aproximacion se rompe y hay que advertirlo.
    expect(massRatio(BODY_CATALOG.blueGiant, 10)).toBeGreaterThan(TEST_PARTICLE_LIMIT)
  })

  it('la masa de la Tierra en masas solares es 3.003e-6', () => {
    expect(M_EARTH_SOLAR).toBeCloseTo(3.003e-6, 9)
  })
})

describe('animacion: los dos relojes', () => {
  it('el camino registra tiempo propio y coordenado, ambos crecientes', () => {
    const { y, k } = circularParticle(20, SCHW, true)
    const res = traceOrbit(y, k, SCHW, { tauMax: 4000 })
    expect(res.properTime.length).toBe(res.path.length)
    for (let i = 1; i < res.path.length; i++) {
      expect(res.properTime[i]).toBeGreaterThan(res.properTime[i - 1])
      expect(res.path[i][0]).toBeGreaterThan(res.path[i - 1][0])
    }
  })

  it('en una orbita circular el tiempo coordenado corre mas que el propio', () => {
    // dt/dtau = u^t > 1: el reloj del que orbita atrasa respecto al lejano.
    const { y, k } = circularParticle(10, SCHW, true)
    const res = traceOrbit(y, k, SCHW, { tauMax: 2000 })
    const dProper = pathDuration(res, 'proper')
    const dCoord = pathDuration(res, 'coordinate')
    expect(dCoord).toBeGreaterThan(dProper)
    // Para una orbita circular en Schwarzschild, u^t = 1/sqrt(1 - 3M/r).
    expect(dCoord / dProper).toBeCloseTo(1 / Math.sqrt(1 - 3 / 10), 3)
  })

  it('la dilatacion crece al acercarse: mas cerca, mas atrasa el reloj propio', () => {
    const ratioAt = (r: number) => {
      const { y, k } = circularParticle(r, SCHW, true)
      const res = traceOrbit(y, k, SCHW, { tauMax: 30 * Math.pow(r, 1.5) })
      return pathDuration(res, 'coordinate') / pathDuration(res, 'proper')
    }
    expect(ratioAt(7)).toBeGreaterThan(ratioAt(20))
    expect(ratioAt(20)).toBeGreaterThan(ratioAt(100))
  })

  it('muestrear en t = 0 da el punto inicial y al final el ultimo', () => {
    const { y, k } = circularParticle(15, SCHW, true)
    const res = traceOrbit(y, k, SCHW, { tauMax: 3000 })
    for (const clock of ['proper', 'coordinate'] as const) {
      const s0 = sampleAt(res, 0, clock)!
      expect(s0.r).toBeCloseTo(15, 4)
      expect(s0.progress).toBeCloseTo(0, 6)
      const sEnd = sampleAt(res, pathDuration(res, clock), clock)!
      expect(sEnd.ended).toBe(true)
      expect(sEnd.progress).toBeCloseTo(1, 6)
    }
  })

  it('el muestreo es monotono en el azimut a lo largo de la orbita', () => {
    const { y, k } = circularParticle(12, SCHW, true)
    const res = traceOrbit(y, k, SCHW, { tauMax: 3000 })
    const total = pathDuration(res, 'proper')
    let prevPhi = -Infinity
    for (let i = 0; i <= 40; i++) {
      const s = sampleAt(res, (total * i) / 40, 'proper')!
      expect(s.x[2]).toBeGreaterThanOrEqual(prevPhi)
      prevPhi = s.x[2]
      // Y el radio se mantiene: es una orbita circular.
      expect(Math.abs(s.r - 12)).toBeLessThan(1e-3)
    }
  })

  it('en una caida, el reloj propio converge y el coordenado diverge', () => {
    /**
     * Esta es la afirmacion fisica correcta, y no una razon fija entre los dos
     * relojes: al acercar el punto de parada al horizonte, el tiempo PROPIO de
     * caida tiende a un valor finito, mientras que el COORDENADO crece sin cota
     * (logaritmicamente, t ~ -2M ln(r/2M - 1)).
     *
     * Por eso una parada al 1 % del horizonte solo da una razon de ~1.2: la
     * divergencia es logaritmica y hay que acercarse mucho para verla grande.
     */
    const fall = (margin: number) => {
      const { y, k } = particleFromLocalVelocity(20, Math.PI / 2, [-0.02, 0, 0.02], SCHW)
      const rPlus = horizons(SCHW).rPlus
      const res = traceOrbit(y, k, SCHW, {
        tauMax: 5000,
        rCapture: rPlus * (1 + margin),
      })
      return {
        outcome: res.outcome,
        proper: pathDuration(res, 'proper'),
        coord: pathDuration(res, 'coordinate'),
      }
    }

    // Los margenes se quedan en el rango donde el integrador con derivadas
    // numericas es estable. Por debajo de ~0.005 el paso adaptativo se estanca
    // persiguiendo las derivadas divergentes de H y la caida no llega a
    // completarse: es el suelo practico del metodo, y es la razon de que
    // CAPTURE_MARGIN valga 0.01 y no algo mucho menor.
    const a = fall(0.05)
    const b = fall(0.02)
    const c = fall(0.01)

    for (const f of [a, b, c]) {
      expect(f.outcome).toBe('captured')
      // El tiempo propio de caida es finito y modesto.
      expect(f.proper).toBeGreaterThan(0)
      expect(f.proper).toBeLessThan(200)
      // Y el coordenado siempre lo supera: el reloj lejano ve la caida mas lenta.
      expect(f.coord).toBeGreaterThan(f.proper)
    }

    // El propio converge: acercarse 25 veces mas al horizonte apenas lo cambia.
    expect(Math.abs(c.proper / a.proper - 1)).toBeLessThan(0.05)
    // El coordenado, en cambio, sigue creciendo de forma apreciable.
    expect(c.coord).toBeGreaterThan(b.coord)
    expect(b.coord).toBeGreaterThan(a.coord)
    // Y crece mas que el propio, asi que la razon entre relojes aumenta.
    expect(c.coord / c.proper).toBeGreaterThan(a.coord / a.proper)
  })

  it('encuentra el instante en que se cruza un radio dado', () => {
    const { y, k } = particleFromLocalVelocity(30, Math.PI / 2, [-0.05, 0, 0.05], SCHW)
    const res = traceOrbit(y, k, SCHW, { tauMax: 5000 })
    const cross = findFirstCrossing(res, 10, 'proper')
    expect(cross).not.toBeNull()
    // En ese instante el radio muestreado debe ser 10.
    const s = sampleAt(res, cross!.time, 'proper')!
    expect(s.r).toBeCloseTo(10, 2)
    // Y cruzar un radio mayor ocurre antes.
    const earlier = findFirstCrossing(res, 20, 'proper')!
    expect(earlier.time).toBeLessThan(cross!.time)
  })

  it('no se cruza un radio que la orbita nunca alcanza', () => {
    const { y, k } = circularParticle(20, SCHW, true)
    const res = traceOrbit(y, k, SCHW, { tauMax: 2000 })
    expect(findFirstCrossing(res, 5, 'proper')).toBeNull()
  })
})

describe('S2 alrededor de Sgr A*', () => {
  it('su periastro esta a ~1400 radios gravitacionales', () => {
    // S2: semieje 970 UA, e = 0.884, alrededor de 4.3e6 masas solares.
    // r_peri = a(1-e) = 112 UA = 1.68e13 m;  r_g = 1.4766e3*4.3e6 = 6.35e9 m
    const rg = gravitationalRadius(4.3e6)
    const AU = 1.495978707e11
    const rPeri = (970 * (1 - 0.884) * AU) / rg
    expect(rPeri).toBeGreaterThan(1000)
    expect(rPeri).toBeLessThan(3500)
  })

  it('a esa distancia S2 no corre peligro de marea', () => {
    const rg = gravitationalRadius(4.3e6)
    const AU = 1.495978707e11
    const rPeri = (970 * (1 - 0.884) * AU) / rg
    const v = tidalVerdict(BODY_CATALOG.s2, 4.3e6, horizons(SCHW).rPlus, rPeri)
    expect(v.reachesTidalRadius).toBe(false)
    expect(v.disrupts).toBe(false)
  })

  it('la precesion relativista del periastro es de minutos de arco por orbita', () => {
    // delta_phi ~ 6 pi M / p, con p el semi-latus rectum en unidades de M.
    const rg = gravitationalRadius(4.3e6)
    const AU = 1.495978707e11
    const a = (970 * AU) / rg
    const e = 0.884
    const p = a * (1 - e * e)
    const precRad = (6 * Math.PI) / p
    const precArcmin = (precRad * 180 * 60) / Math.PI
    // GRAVITY midio ~12 minutos de arco por orbita.
    expect(precArcmin).toBeGreaterThan(5)
    expect(precArcmin).toBeLessThan(25)
  })
})
