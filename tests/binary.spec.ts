/**
 * Validacion de la binaria (Brill-Lindquist), la dinamica post-newtoniana, las
 * ondas gravitacionales y el embedding isometrico.
 *
 * La prueba clave de la metrica es esta: con m2 = 0, Brill-Lindquist es
 * EXACTAMENTE Schwarzschild en coordenadas isotropas. El integrador de `binary.ts`
 * esta escrito en cartesianas isotropas y no explota ninguna simetria axial, asi
 * que reproducir sqrt(27) M por ese camino es una verificacion independiente del
 * trazador de Boyer-Lindquist: dos sistemas de coordenadas distintos, el mismo
 * numero.
 */

import { describe, expect, it } from 'vitest'
import {
  admMass,
  binaryHamiltonian,
  binaryPhotonFrom,
  conformalFactor,
  conformalGradient,
  isotropicHorizonRadius,
  isotropicPhotonSphere,
  isotropicToSchwarzschild,
  lapse,
  properSeparation,
  traceBinaryRay,
  type Puncture,
} from '../src/physics/binary'
import {
  A_MERGE,
  chirpMass,
  coalescenceTimeCircular,
  dadt,
  dedt,
  massToSeconds,
  orbitalPeriodDecay,
  stepOrbit,
  symmetricMassRatio,
  type BinaryOrbit,
} from '../src/physics/pn'
import {
  chirpRate,
  gwLuminosity,
  inspiralWaveform,
  mergerFrequency,
  orbitalFrequencyHz,
  strain,
  timeToMerger,
} from '../src/physics/waves'
import {
  equatorialEmbedding,
  flammParaboloid,
  horizonEmbedding,
  HORIZON_EMBEDDING_CRITICAL_SPIN,
  properRadialDistance,
  radialStretch,
  staticLapse,
} from '../src/physics/embedding'
import { PARSEC } from '../src/physics/units'

// ===========================================================================
// Metrica de Brill-Lindquist
// ===========================================================================

describe('Brill-Lindquist: limite de un solo agujero', () => {
  const single: Puncture[] = [{ m: 1, pos: [0, 0, 0] }]

  it('psi = 1 + M/(2r) y el lapso es el de Schwarzschild isotropo', () => {
    for (const r of [1, 2, 5, 20]) {
      const psi = conformalFactor([r, 0, 0], single)
      expect(psi).toBeCloseTo(1 + 1 / (2 * r), 12)
      // alpha = (1 - M/2r)/(1 + M/2r)
      expect(lapse(psi)).toBeCloseTo((1 - 1 / (2 * r)) / (1 + 1 / (2 * r)), 12)
    }
  })

  it('el horizonte queda en psi = 2, es decir r_iso = M/2', () => {
    const rH = isotropicHorizonRadius(1)
    expect(rH).toBeCloseTo(0.5, 12)
    expect(conformalFactor([rH, 0, 0], single)).toBeCloseTo(2, 12)
    expect(lapse(2)).toBeCloseTo(0, 12)
  })

  it('la transformacion a Schwarzschild lleva el horizonte a r = 2M', () => {
    expect(isotropicToSchwarzschild(0.5, 1)).toBeCloseTo(2, 12)
    // Y la esfera de fotones isotropa a r_schw = 3M.
    expect(isotropicToSchwarzschild(isotropicPhotonSphere(1), 1)).toBeCloseTo(3, 10)
  })

  it('la esfera de fotones isotropa esta en M/(2(2-sqrt3)) ~ 1.866 M', () => {
    expect(isotropicPhotonSphere(1)).toBeCloseTo(1 / (2 * (2 - Math.sqrt(3))), 12)
    expect(isotropicPhotonSphere(1)).toBeCloseTo(1.86603, 4)
  })

  it('el gradiente de psi apunta hacia la masa', () => {
    const g = conformalGradient([10, 0, 0], single)
    expect(g[0]).toBeLessThan(0) // hacia el origen
    expect(g[1]).toBeCloseTo(0, 12)
    // |grad psi| = M/(2r^2)
    expect(Math.abs(g[0])).toBeCloseTo(1 / (2 * 100), 12)
  })

  it('la masa ADM es la suma de las masas de puntura', () => {
    expect(admMass([{ m: 0.6, pos: [0, 0, 0] }, { m: 0.4, pos: [10, 0, 0] }])).toBeCloseTo(1, 12)
  })
})

describe('Brill-Lindquist: geodesicas nulas', () => {
  const single: Puncture[] = [{ m: 1, pos: [0, 0, 0] }]

  /** Lanza un foton desde x0 hacia -x con desplazamiento b en y (parametro de impacto). */
  const shoot = (b: number, punctures: Puncture[], x0 = 2000) => {
    const ray = binaryPhotonFrom([x0, b, 0], [-1, 0, 0], punctures)
    return traceBinaryRay(ray, punctures, {
      tol: 1e-11,
      maxSteps: 400_000,
      rEscape: x0 * 1.5,
      h0: 1,
    })
  }

  it('el momento inicial es nulo (H = 0) para cualquier direccion', () => {
    for (const dir of [
      [-1, 0, 0],
      [-0.6, 0.5, 0.62449979983983983],
      [0.3, -0.4, 0.8660254037844386],
    ] as Array<[number, number, number]>) {
      const ray = binaryPhotonFrom([12, 3, -2], dir, single)
      expect(Math.abs(binaryHamiltonian(ray, single))).toBeLessThan(1e-12)
    }
  })

  it('H se conserva a lo largo de la integracion', () => {
    const res = shoot(6, single)
    expect(res.maxHamiltonianDrift).toBeLessThan(1e-9)
  })

  it('el parametro de impacto critico es sqrt(27) M, por un camino de coordenadas distinto', () => {
    // Esta es la prueba central del modulo. El parametro de impacto es una
    // cantidad ASINTOTICA y por tanto independiente de las coordenadas, asi que
    // debe salir el mismo sqrt(27) que da el trazador de Boyer-Lindquist, que usa
    // Boyer-Lindquist esfericas en lugar de cartesianas isotropas.
    const bc = Math.sqrt(27)
    const x0 = 2000

    /**
     * Convierte el desplazamiento COORDENADO en y al parametro de impacto real.
     *
     * El rayo se lanza desde (x0, b, 0) apuntando en -x, y su momento angular
     * conservado es L_z = x p_y - y p_x = b psi(x0)^2, con E = alpha(x0). El
     * parametro de impacto asintotico es
     *   b_real = L_z / E = b psi^2 / alpha
     * A x0 = 2000 el factor vale 1.001: confundirlo con b introduce un error del
     * 0.1 %, justo del tamano de la discrepancia que se observaba.
     */
    const toImpactParameter = (bCoord: number) => {
      const psi = conformalFactor([x0, bCoord, 0], single)
      return (bCoord * psi * psi) / lapse(psi)
    }

    expect(shoot(bc * 0.98, single, x0).outcome).toBe('captured')
    expect(shoot(bc * 1.02, single, x0).outcome).toBe('escaped')

    // Umbral por biseccion sobre el desplazamiento coordenado...
    let lo = 3
    let hi = 8
    for (let i = 0; i < 30; i++) {
      const mid = 0.5 * (lo + hi)
      if (shoot(mid, single, x0).outcome === 'captured') lo = mid
      else hi = mid
    }
    // ...convertido al parametro de impacto real.
    const measured = toImpactParameter(0.5 * (lo + hi))
    expect(measured).toBeCloseTo(bc, 3)
  }, 120_000)

  it('la deflexion en campo debil tiende a 4M/b', () => {
    for (const b of [200, 500]) {
      const res = shoot(b, single, 200000)
      expect(res.outcome).toBe('escaped')
      const dir = res.skyDir!
      // El rayo entraba en -x; se mide el angulo girado.
      const alpha = Math.atan2(Math.hypot(dir[1], dir[2]), -dir[0])
      const weak = 4 / b
      // A este b el termino de segundo orden aporta ~1e-2 relativo.
      expect(Math.abs(alpha / weak - 1)).toBeLessThan(0.02)
    }
  }, 120_000)

  it('un foton radial hacia dentro cae', () => {
    const ray = binaryPhotonFrom([50, 0, 0], [-1, 0, 0], single)
    const res = traceBinaryRay(ray, single, { tol: 1e-10, maxSteps: 200_000 })
    expect(res.outcome).toBe('captured')
    expect(res.capturedBy).toBe(0)
  })
})

describe('Brill-Lindquist: dos agujeros', () => {
  const pair: Puncture[] = [
    { m: 0.5, pos: [-10, 0, 0] },
    { m: 0.5, pos: [10, 0, 0] },
  ]

  it('psi es la suma de las dos contribuciones', () => {
    const x: [number, number, number] = [0, 5, 0]
    const r1 = Math.hypot(10, 5)
    const r2 = Math.hypot(10, 5)
    expect(conformalFactor(x, pair)).toBeCloseTo(1 + 0.5 / (2 * r1) + 0.5 / (2 * r2), 12)
  })

  it('cada agujero captura los rayos que apuntan a el', () => {
    for (const [idx, target] of [[0, -10], [1, 10]] as Array<[number, number]>) {
      const ray = binaryPhotonFrom([target, 0, 60], [0, 0, -1], pair)
      const res = traceBinaryRay(ray, pair, { tol: 1e-10, maxSteps: 200_000 })
      expect(res.outcome).toBe('captured')
      expect(res.capturedBy).toBe(idx)
    }
  })

  it('un rayo que pasa entre los dos escapa, y se desvia', () => {
    // Por el centro exacto, la simetria hace que las fuerzas transversales se
    // cancelen y el rayo sale recto.
    const center = binaryPhotonFrom([0, 0, 400], [0, 0, -1], pair)
    const resC = traceBinaryRay(center, pair, { tol: 1e-11, maxSteps: 300_000, rEscape: 600 })
    expect(resC.outcome).toBe('escaped')
    expect(Math.abs(resC.skyDir![0])).toBeLessThan(1e-6)

    // Desplazado, se desvia hacia el agujero mas cercano.
    const off = binaryPhotonFrom([4, 0, 400], [0, 0, -1], pair)
    const resO = traceBinaryRay(off, pair, { tol: 1e-11, maxSteps: 300_000, rEscape: 600 })
    expect(resO.outcome).toBe('escaped')
    expect(resO.skyDir![0]).toBeGreaterThan(1e-4) // atraido hacia +x
  }, 60_000)

  it('la separacion propia es mayor que la coordenada', () => {
    // Es una de las formas de ver que las coordenadas isotropas no miden
    // distancias: el factor conforme psi^2 estira el espacio entre los agujeros.
    const coord = 20
    const proper = properSeparation(pair)
    expect(proper).toBeGreaterThan(coord)
  })

  it('a mayor separacion, la geometria tiende a la de dos agujeros aislados', () => {
    const far: Puncture[] = [
      { m: 0.5, pos: [-500, 0, 0] },
      { m: 0.5, pos: [500, 0, 0] },
    ]
    // Junto a una de las punturas, psi debe parecerse al de un agujero solo.
    const x: [number, number, number] = [-500 + 3, 0, 0]
    const psiPair = conformalFactor(x, far)
    const psiSingle = 1 + 0.5 / (2 * 3)
    expect(psiPair / psiSingle).toBeCloseTo(1, 3)
  })
})

// ===========================================================================
// Dinamica post-newtoniana
// ===========================================================================

describe('masa de chirp y razones de masa', () => {
  it('para masas iguales, M_c = M / 2^{6/5}', () => {
    const mc = chirpMass({ m1: 0.5, m2: 0.5 })
    expect(mc).toBeCloseTo(1 / Math.pow(2, 1.2), 12)
  })

  it('la razon de masa simetrica vale 1/4 para masas iguales y menos si no', () => {
    expect(symmetricMassRatio({ m1: 0.5, m2: 0.5 })).toBeCloseTo(0.25, 12)
    expect(symmetricMassRatio({ m1: 0.8, m2: 0.2 })).toBeLessThan(0.25)
  })

  it('reproduce la masa de chirp de GW150914', () => {
    // Masas publicadas del sistema en el marco fuente: ~36 y ~29 M_sol.
    const mc = chirpMass({ m1: 36, m2: 29 })
    expect(mc).toBeGreaterThan(27)
    expect(mc).toBeLessThan(29)
  })
})

describe('reaccion de radiacion (ecuaciones de Peters)', () => {
  const circ: BinaryOrbit = { m1: 0.5, m2: 0.5, a: 100, e: 0, nu: 0 }

  it('da/dt es negativa: la orbita se encoge', () => {
    expect(dadt(circ)).toBeLessThan(0)
  })

  it('de/dt se anula para orbita circular y es negativa si hay excentricidad', () => {
    expect(dedt(circ)).toBeCloseTo(0, 15)
    expect(dedt({ ...circ, e: 0.5 })).toBeLessThan(0)
  })

  it('da/dt circular coincide con -(64/5) m1 m2 M / a^3', () => {
    const expected = (-64 / 5) * (circ.m1 * circ.m2 * 1) / Math.pow(circ.a, 3)
    expect(dadt(circ)).toBeCloseTo(expected, 12)
  })

  it('la excentricidad amplifica la emision segun (1-e^2)^{-7/2}', () => {
    const e = 0.6
    const ratio = dadt({ ...circ, e }) / dadt(circ)
    const expected =
      Math.pow(1 - e * e, -3.5) * (1 + (73 * e * e) / 24 + (37 * Math.pow(e, 4)) / 96)
    expect(ratio).toBeCloseTo(expected, 10)
  })

  it('integrar da/dt reproduce el tiempo de coalescencia en forma cerrada', () => {
    // t_c = (5/256) a^4/(m1 m2 M). Se integra numericamente y se compara.
    let o: BinaryOrbit = { m1: 0.5, m2: 0.5, a: 60, e: 0, nu: 0 }
    const closed = coalescenceTimeCircular(o)
    let t = 0
    // Paso proporcional al tiempo restante, para no gastar pasos al principio.
    for (let i = 0; i < 400_000 && o.a > A_MERGE; i++) {
      const dt = Math.max(1e-4, 0.0008 * Math.pow(o.a, 4) / (o.m1 * o.m2))
      const r = stepOrbit(o, dt)
      o = r.orbit
      t += dt
      if (r.merged) break
    }
    // El cierre en a = A_MERGE recorta la ultima parte, que en el calculo cerrado
    // llega hasta a = 0: la correccion es (A_MERGE/a0)^4, aqui ~1e-4.
    const truncation = Math.pow(A_MERGE / 60, 4)
    expect(t / closed).toBeCloseTo(1 - truncation, 2)
  }, 60_000)

  it('la excentricidad decrece: la radiacion circulariza', () => {
    let o: BinaryOrbit = { m1: 0.5, m2: 0.5, a: 80, e: 0.7, nu: 0 }
    const e0 = o.e
    for (let i = 0; i < 3000; i++) o = stepOrbit(o, 500).orbit
    expect(o.e).toBeLessThan(e0)
    expect(o.a).toBeLessThan(80)
  })
})

describe('Hulse-Taylor: PSR B1913+16', () => {
  it('reproduce el decaimiento orbital medido, -2.40e-12 s/s', () => {
    // Parametros del sistema (Weisberg & Huang 2016):
    //   m1 = 1.4398, m2 = 1.3886 M_sol,  P = 27906.98 s,  e = 0.6171
    // El valor medido de dP/dt es -2.423e-12, y el predicho por relatividad
    // general -2.4025e-12. Ese acuerdo fue el Nobel de Fisica de 1993.
    const dPdt = orbitalPeriodDecay(1.4398, 1.3886, 27906.98, 0.6171)
    expect(dPdt).toBeLessThan(0)
    expect(dPdt).toBeCloseTo(-2.4025e-12, 13)
    // Dentro del 2 % del valor publicado.
    expect(Math.abs(dPdt / -2.4025e-12 - 1)).toBeLessThan(0.02)
  })

  it('sin excentricidad el decaimiento seria mucho menor', () => {
    const ecc = orbitalPeriodDecay(1.4398, 1.3886, 27906.98, 0.6171)
    const circ = orbitalPeriodDecay(1.4398, 1.3886, 27906.98, 0)
    // El factor de amplificacion por excentricidad es ~11.8 para e = 0.6171.
    expect(Math.abs(ecc / circ)).toBeGreaterThan(10)
    expect(Math.abs(ecc / circ)).toBeLessThan(14)
  })

  it('GM/c^3 vale 4.9255 microsegundos por masa solar', () => {
    expect(massToSeconds(1)).toBeCloseTo(4.9255e-6, 9)
  })
})

// ===========================================================================
// Ondas gravitacionales
// ===========================================================================

describe('ondas gravitacionales', () => {
  it('la relacion de chirp escala como f^{11/3}', () => {
    const r1 = chirpRate(50, 36, 29)
    const r2 = chirpRate(100, 36, 29)
    expect(r2 / r1).toBeCloseTo(Math.pow(2, 11 / 3), 8)
  })

  it('df/dt escala como M_c^{5/3}', () => {
    // Duplicar las dos masas duplica M_c, y df/dt debe subir 2^{5/3}.
    const r1 = chirpRate(60, 30, 30)
    const r2 = chirpRate(60, 60, 60)
    expect(r2 / r1).toBeCloseTo(Math.pow(2, 5 / 3), 8)
  })

  it('el tiempo hasta la fusion es consistente con la relacion de chirp', () => {
    // Derivando tau = (5/256)(pi f)^{-8/3} (GM_c/c^3)^{-5/3} debe salir
    // -dtau/df = (8/3) tau / f, y por la regla de la cadena df/dt = f/((8/3) tau).
    const f = 40
    const tau = timeToMerger(f, 36, 29)
    const expected = f / ((8 / 3) * tau)
    expect(chirpRate(f, 36, 29)).toBeCloseTo(expected, 6)
  })

  it('la amplitud escala como 1/D y como M_c^{5/3}', () => {
    const a1 = strain(100, 30, 30, 1e24, 0, 0).amplitude
    const a2 = strain(100, 30, 30, 2e24, 0, 0).amplitude
    expect(a1 / a2).toBeCloseTo(2, 10)

    const b1 = strain(100, 30, 30, 1e24, 0, 0).amplitude
    const b2 = strain(100, 60, 60, 1e24, 0, 0).amplitude
    expect(b2 / b1).toBeCloseTo(Math.pow(2, 5 / 3), 8)
  })

  it('la amplitud de GW150914 es del orden de 1e-21', () => {
    // 36 + 29 M_sol a 410 Mpc, cerca de la fusion.
    const d = 410e6 * PARSEC
    const s = strain(150, 36, 29, d, 0, 0)
    expect(s.amplitude).toBeGreaterThan(2e-22)
    expect(s.amplitude).toBeLessThan(5e-21)
  })

  it('las dos polarizaciones estan en cuadratura, y hx se anula de canto', () => {
    // Vista de canto (i = pi/2) solo queda h+; de frente (i = 0) ambas son maximas.
    const edge = strain(100, 30, 30, 1e24, Math.PI / 2, 0)
    expect(edge.hCross).toBeCloseTo(0, 12)
    const face = strain(100, 30, 30, 1e24, 0, 0)
    expect(Math.abs(face.hPlus)).toBeCloseTo(face.amplitude, 12)
  })

  it('la luminosidad del pico de GW150914 es del orden de 1e49 W', () => {
    // A separacion de unos pocos radios gravitacionales.
    const rg = 1.4766e3 * 65 // GM/c^2 en metros para 65 M_sol
    const L = gwLuminosity(36, 29, 4 * rg)
    expect(L).toBeGreaterThan(1e47)
    expect(L).toBeLessThan(1e51)
  })

  it('la frecuencia orbital sigue la tercera ley de Kepler', () => {
    const f1 = orbitalFrequencyHz(100, 65)
    const f2 = orbitalFrequencyHz(400, 65)
    expect(f1 / f2).toBeCloseTo(Math.pow(4, 1.5), 8)
  })

  it('la frecuencia de corte de GW150914 esta en decenas de Hz', () => {
    // El modelo corta en a = 6M. El pico observado (~250 Hz) corresponde ya a la
    // fusion, que este modelo NO cubre: la diferencia es el limite declarado.
    const f = mergerFrequency(36, 29)
    expect(f).toBeGreaterThan(30)
    expect(f).toBeLessThan(120)
  })

  it('la forma de onda del inspiral aumenta en frecuencia y amplitud', () => {
    const w = inspiralWaveform(36, 29, 410e6 * PARSEC, 0, 20, 512)
    expect(w.length).toBe(512)
    expect(w[w.length - 1].fGw).toBeGreaterThan(w[0].fGw)
    // La amplitud crece como f^{2/3}.
    const a0 = Math.hypot(w[0].hPlus, w[0].hCross)
    const a1 = Math.hypot(w[w.length - 1].hPlus, w[w.length - 1].hCross)
    expect(a1).toBeGreaterThan(a0)
    // El tiempo avanza monotonamente.
    for (let i = 1; i < w.length; i++) expect(w[i].t).toBeGreaterThan(w[i - 1].t)
  })
})

// ===========================================================================
// Embedding isometrico
// ===========================================================================

describe('paraboloide de Flamm', () => {
  it('reproduce la metrica inducida dr^2/(1-2M/r) exactamente', () => {
    // Es la propiedad que hace que el embedding sea isometrico y no decorativo:
    // dr^2 + dz^2 debe igualar dr^2/(1 - 2M/r).
    for (const r of [2.5, 3, 6, 12, 40]) {
      const h = 1e-6
      const dz = (flammParaboloid(r + h) - flammParaboloid(r - h)) / (2 * h)
      const lhs = 1 + dz * dz
      const rhs = 1 / (1 - 2 / r)
      expect(lhs).toBeCloseTo(rhs, 6)
    }
  })

  it('la pendiente exacta es sqrt(2M/(r-2M))', () => {
    for (const r of [3, 6, 20]) {
      const h = 1e-7
      const dz = (flammParaboloid(r + h) - flammParaboloid(r - h)) / (2 * h)
      expect(dz).toBeCloseTo(Math.sqrt(2 / (r - 2)), 4)
    }
  })

  it('se anula en el horizonte y no existe dentro', () => {
    expect(flammParaboloid(2)).toBeCloseTo(0, 12)
    expect(Number.isNaN(flammParaboloid(1.5))).toBe(true)
  })

  it('la pendiente diverge en el horizonte: la garganta es vertical', () => {
    expect(Math.sqrt(2 / (2.0001 - 2))).toBeGreaterThan(100)
  })
})

describe('embedding de la rebanada ecuatorial', () => {
  it('para Schwarzschild coincide con el paraboloide de Flamm', () => {
    const emb = equatorialEmbedding({ a: 0, q: 0 }, 20, 3000)
    // El radio circunferencial es r en Schwarzschild.
    for (const pt of emb.points.filter((p) => p.r > 2.5 && p.r < 19)) {
      expect(pt.R).toBeCloseTo(pt.r, 6)
    }
    // La altura, salvo la constante de integracion, sigue a Flamm.
    const inner = emb.points.find((p) => p.r > 2.2)!
    const outer = emb.points[emb.points.length - 1]
    const dzMeasured = outer.z - inner.z
    const dzFlamm = flammParaboloid(outer.r) - flammParaboloid(inner.r)
    expect(dzMeasured / dzFlamm).toBeCloseTo(1, 2)
  })

  it('para Schwarzschild el embedding no falla en ningun radio', () => {
    const emb = equatorialEmbedding({ a: 0, q: 0 }, 20, 800)
    expect(Number.isNaN(emb.embeddingFailsBelow)).toBe(true)
  })

  it('la rebanada ecuatorial se puede sumergir tambien con espin alto', () => {
    // Ojo: el famoso limite sqrt(3)/2 es del embedding de la SUPERFICIE DEL
    // HORIZONTE, no de la rebanada ecuatorial. Son dos afirmaciones distintas y
    // conviene no confundirlas: en el ecuador g_rr = r^2/Delta diverge en el
    // horizonte, asi que el radicando se mantiene positivo.
    for (const a of [0.2, 0.9, 0.998]) {
      const emb = equatorialEmbedding({ a, q: 0 }, 20, 1200)
      expect(Number.isNaN(emb.embeddingFailsBelow)).toBe(true)
    }
  })

  it('la garganta es mas profunda cuanto mas cerca se llega del horizonte', () => {
    const shallow = equatorialEmbedding({ a: 0, q: 0 }, 10, 600)
    const deep = equatorialEmbedding({ a: 0, q: 0 }, 30, 600)
    expect(deep.depth).toBeGreaterThan(shallow.depth)
  })
})

describe('embedding de la superficie del horizonte (Smarr)', () => {
  it('Schwarzschild: el horizonte es una esfera de radio 2M y area 16 pi', () => {
    const emb = horizonEmbedding({ a: 0, q: 0 })
    expect(emb.fails).toBe(false)
    expect(emb.area).toBeCloseTo(16 * Math.PI, 10)
    // El radio ecuatorial es r+ = 2.
    const eq = emb.profile.find((p) => Math.abs(p.theta - Math.PI / 2) < 0.01)!
    expect(eq.R).toBeCloseTo(2, 3)
  })

  it('el area del horizonte es 4 pi (r+^2 + a^2)', () => {
    for (const a of [0, 0.5, 0.9]) {
      const p = { a, q: 0 }
      const rp = 1 + Math.sqrt(1 - a * a)
      expect(horizonEmbedding(p).area).toBeCloseTo(4 * Math.PI * (rp * rp + a * a), 10)
    }
  })

  it('el embedding euclideo falla exactamente por encima de a/M = sqrt(3)/2', () => {
    // Resultado clasico de Smarr (1973). Desarrollando el radicando cerca del polo
    // sale theta^2 (r+^2 + a^2 - 4a^2), que se anula cuando r+^2 = 3a^2; con
    // a = sqrt(3)/2 resulta r+ = 1.5 y r+^2 = 2.25 = 3a^2 exactamente.
    expect(HORIZON_EMBEDDING_CRITICAL_SPIN).toBeCloseTo(0.8660254, 6)

    // Por debajo del critico se puede sumergir.
    for (const a of [0, 0.3, 0.6, 0.85]) {
      expect(horizonEmbedding({ a, q: 0 }, 2000).fails).toBe(false)
    }
    // Por encima, no.
    for (const a of [0.88, 0.95, 0.998]) {
      expect(horizonEmbedding({ a, q: 0 }, 2000).fails).toBe(true)
    }
  })

  it('la condicion critica es exactamente r+^2 = 3 a^2', () => {
    const a = HORIZON_EMBEDDING_CRITICAL_SPIN
    const rp = 1 + Math.sqrt(1 - a * a)
    expect(rp).toBeCloseTo(1.5, 10)
    expect(rp * rp).toBeCloseTo(3 * a * a, 10)
  })

  it('el casquete no sumergible crece con el espin', () => {
    // El fallo arranca siempre en el polo exacto, asi que lo que distingue un
    // espin de otro es la EXTENSION del casquete afectado, no donde empieza.
    const a88 = horizonEmbedding({ a: 0.88, q: 0 }, 4000)
    const a95 = horizonEmbedding({ a: 0.95, q: 0 }, 4000)
    const a998 = horizonEmbedding({ a: 0.998, q: 0 }, 4000)
    expect(a88.fails && a95.fails && a998.fails).toBe(true)
    expect(a95.failCapAngle).toBeGreaterThan(a88.failCapAngle)
    expect(a998.failCapAngle).toBeGreaterThan(a95.failCapAngle)
    // Sigue siendo un CASQUETE polar y no medio horizonte: a a = 0.88 abarca unos
    // 21 grados. Que no sea diminuto justo por encima del critico es esperable: el
    // coeficiente r+^2 - 3a^2 del desarrollo se anula ahi, pero los terminos de
    // orden superior no, asi que la transicion no tiene por que ser estrecha.
    expect(a88.failCapAngle).toBeLessThan(0.6)
    expect(a998.failCapAngle).toBeLessThan(Math.PI / 2)
  })

  it('la carga tambien puede romper el embedding, al contraer r+', () => {
    // Con carga, r+ baja y la condicion r+^2 >= 3a^2 se viola con menos espin.
    expect(horizonEmbedding({ a: 0.8, q: 0 }, 2000).fails).toBe(false)
    expect(horizonEmbedding({ a: 0.8, q: 0.5 }, 2000).fails).toBe(true)
  })
})

describe('curvatura del tiempo: lo que el embudo no muestra', () => {
  it('el lapso de Schwarzschild es sqrt(1 - 2M/r)', () => {
    for (const r of [3, 6, 20, 100]) {
      expect(staticLapse(r, { a: 0, q: 0 })).toBeCloseTo(Math.sqrt(1 - 2 / r), 12)
    }
  })

  it('el lapso se anula en el horizonte y tiende a 1 en el infinito', () => {
    expect(staticLapse(2.0000001, { a: 0, q: 0 })).toBeLessThan(1e-3)
    expect(staticLapse(1e6, { a: 0, q: 0 })).toBeCloseTo(1, 5)
  })

  it('dentro de la ergosfera no hay observador estatico y el lapso es NaN', () => {
    // Con a = 0.9 la ergosfera ecuatorial llega a r = 2.
    expect(Number.isNaN(staticLapse(1.8, { a: 0.9, q: 0 }))).toBe(true)
    expect(Number.isFinite(staticLapse(2.5, { a: 0.9, q: 0 }))).toBe(true)
  })

  it('el estiramiento radial vale 1 lejos y diverge en el horizonte', () => {
    const p = { a: 0, q: 0 }
    expect(radialStretch(1e6, p)).toBeCloseTo(1, 5)
    expect(radialStretch(2.001, p)).toBeGreaterThan(20)
    expect(radialStretch(2, p)).toBe(Infinity)
  })

  it('la distancia propia es mayor que la diferencia de coordenadas', () => {
    // Es la version cuantitativa de "la malla se estira".
    const p = { a: 0, q: 0 }
    const proper = properRadialDistance(3, 10, p)
    expect(proper).toBeGreaterThan(7)
    // Lejos del agujero, coordenada y distancia propia convergen.
    const far = properRadialDistance(1000, 1010, p)
    expect(far).toBeCloseTo(10, 1)
  })
})
