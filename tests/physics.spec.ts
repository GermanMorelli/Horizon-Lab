/**
 * Validacion de la geometria de Kerr-Newman contra resultados analiticos
 * conocidos. Esto es lo que respalda la palabra "simulacion" del proyecto:
 * si algo aqui se rompe, la imagen que produce el shader no es fisica.
 */

import { describe, expect, it } from 'vitest'
import {
  accretionEfficiency,
  circularOmega,
  ergosphereRadius,
  horizons,
  inverseMetric,
  iscoKerrAnalytic,
  iscoRadius,
  metric,
  photonCircularRadius,
  photonMomentumFromDirection,
  photonSphereRNAnalytic,
  redshiftFactor,
  staticRedshift,
  surfaceGravity,
  zamoLapse,
  type BHParams,
} from '../src/physics/kerrNewman'
import {
  criticalImpactParameterStatic,
  criticalImpactParams,
  criticalImpactParamsBardeenKerr,
  polarShadowRadius,
  shadowAngularRadius,
  shadowMetrics,
} from '../src/physics/shadowRim'
import { deflectionAngle, hamiltonian } from '../src/physics/geodesic'
import { planckSpectralNu } from '../src/physics/blackbody'

const SCHWARZSCHILD: BHParams = { a: 0, q: 0 }

describe('horizontes', () => {
  it('Schwarzschild: r+ = 2, r- = 0', () => {
    const h = horizons(SCHWARZSCHILD)
    expect(h.rPlus).toBeCloseTo(2, 12)
    expect(h.rMinus).toBeCloseTo(0, 12)
    expect(h.hasHorizon).toBe(true)
  })

  it('r+- = 1 +- sqrt(1 - a^2 - q^2) para una malla de (a, q)', () => {
    for (const a of [0, 0.2, 0.5, 0.9, -0.7]) {
      for (const q of [0, 0.1, 0.4, 0.6]) {
        if (a * a + q * q > 1) continue
        const h = horizons({ a, q })
        const root = Math.sqrt(1 - a * a - q * q)
        expect(h.rPlus).toBeCloseTo(1 + root, 12)
        expect(h.rMinus).toBeCloseTo(1 - root, 12)
      }
    }
  })

  it('Reissner-Nordstrom extremal (a=0, q=1): horizontes degenerados en r=1', () => {
    const h = horizons({ a: 0, q: 1 })
    expect(h.rPlus).toBeCloseTo(1, 12)
    expect(h.rMinus).toBeCloseTo(1, 12)
    expect(h.isExtremal).toBe(true)
  })

  it('Kerr extremal (a=1): horizonte en r=1', () => {
    const h = horizons({ a: 1, q: 0 })
    expect(h.rPlus).toBeCloseTo(1, 12)
    expect(h.isExtremal).toBe(true)
  })

  it('a^2 + q^2 > 1 no tiene horizonte (singularidad desnuda)', () => {
    const h = horizons({ a: 0.9, q: 0.7 })
    expect(h.hasHorizon).toBe(false)
    expect(Number.isNaN(h.rPlus)).toBe(true)
  })

  it('gravedad superficial de Schwarzschild kappa = 1/4', () => {
    expect(surfaceGravity(SCHWARZSCHILD)).toBeCloseTo(0.25, 12)
  })

  it('gravedad superficial se anula en el caso extremo', () => {
    expect(surfaceGravity({ a: 1, q: 0 })).toBeCloseTo(0, 12)
    expect(surfaceGravity({ a: 0, q: 1 })).toBeCloseTo(0, 12)
  })
})

describe('ergosfera', () => {
  it('Kerr: radio ecuatorial 2, y coincide con r+ en el polo', () => {
    const p: BHParams = { a: 0.8, q: 0 }
    expect(ergosphereRadius(Math.PI / 2, p)).toBeCloseTo(2, 12)
    expect(ergosphereRadius(0, p)).toBeCloseTo(horizons(p).rPlus, 12)
  })

  it('para a=0 degenera al horizonte a toda latitud', () => {
    for (const th of [0, 0.5, 1, Math.PI / 2]) {
      expect(ergosphereRadius(th, SCHWARZSCHILD)).toBeCloseTo(2, 12)
    }
  })

  it('la carga la contrae', () => {
    const eq0 = ergosphereRadius(Math.PI / 2, { a: 0.6, q: 0 })
    const eq1 = ergosphereRadius(Math.PI / 2, { a: 0.6, q: 0.5 })
    expect(eq1).toBeLessThan(eq0)
  })
})

describe('metrica', () => {
  it('g^{mu nu} es la inversa de g_{mu nu} en el bloque (t, phi)', () => {
    const p: BHParams = { a: 0.77, q: 0.31 }
    for (const r of [3, 5, 12, 40]) {
      for (const th of [0.3, 1.0, Math.PI / 2, 2.4]) {
        const g = metric(r, th, p)
        const gi = inverseMetric(r, th, p)
        // Producto de matrices 2x2 = identidad
        expect(g.g_tt * gi.gtt + g.g_tphi * gi.gtphi).toBeCloseTo(1, 10)
        expect(g.g_tt * gi.gtphi + g.g_tphi * gi.gphiphi).toBeCloseTo(0, 10)
        expect(g.g_tphi * gi.gtt + g.g_phiphi * gi.gtphi).toBeCloseTo(0, 10)
        expect(g.g_tphi * gi.gtphi + g.g_phiphi * gi.gphiphi).toBeCloseTo(1, 10)
        // Bloque diagonal
        expect(g.g_rr * gi.grr).toBeCloseTo(1, 12)
        expect(g.g_thth * gi.gthth).toBeCloseTo(1, 12)
      }
    }
  })

  it('lapso ZAMO se reduce a sqrt(1 - 2/r) en Schwarzschild', () => {
    for (const r of [3, 6, 20, 100]) {
      expect(zamoLapse(r, Math.PI / 2, SCHWARZSCHILD)).toBeCloseTo(Math.sqrt(1 - 2 / r), 12)
    }
  })

  it('la tetrada ZAMO produce momentos nulos (H = 0) para cualquier direccion', () => {
    const p: BHParams = { a: 0.85, q: 0.4 }
    const r = 14
    const th = 1.2
    for (const dir of [
      [-1, 0, 0],
      [-0.6, 0.5, 0.62449979983983983],
      [0.3, -0.4, 0.8660254037844386],
      [0, 1, 0],
    ] as Array<[number, number, number]>) {
      const n = Math.hypot(...dir)
      const unit: [number, number, number] = [dir[0] / n, dir[1] / n, dir[2] / n]
      const [p_t, p_r, p_th, p_ph] = photonMomentumFromDirection(r, th, unit, p)
      const H = hamiltonian([0, r, th, 0, p_r, p_th], { E: -p_t, L: p_ph }, p)
      // H debe anularse: el momento local es nulo por construccion.
      expect(Math.abs(H)).toBeLessThan(1e-12)
    }
  })
})

describe('orbitas circulares de fotones (esfera de fotones)', () => {
  it('Schwarzschild: r_ph = 3', () => {
    expect(photonCircularRadius(SCHWARZSCHILD, true)).toBeCloseTo(3, 8)
    expect(photonCircularRadius(SCHWARZSCHILD, false)).toBeCloseTo(3, 8)
  })

  it('Kerr extremal: 1 (prograda) y 4 (retrograda)', () => {
    expect(photonCircularRadius({ a: 1, q: 0 }, true)).toBeCloseTo(1, 5)
    expect(photonCircularRadius({ a: 1, q: 0 }, false)).toBeCloseTo(4, 5)
  })

  it('Kerr: coincide con r_ph = 2{1 + cos[(2/3) arccos(-+a)]}', () => {
    for (const a of [0, 0.25, 0.5, 0.75, 0.9, 0.998]) {
      const pro = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a)))
      const retro = 2 * (1 + Math.cos((2 / 3) * Math.acos(a)))
      expect(photonCircularRadius({ a, q: 0 }, true)).toBeCloseTo(pro, 6)
      expect(photonCircularRadius({ a, q: 0 }, false)).toBeCloseTo(retro, 6)
    }
  })

  it('Reissner-Nordstrom: coincide con la raiz de r^2 - 3r + 2q^2 = 0', () => {
    for (const q of [0, 0.25, 0.5, 0.75, 1]) {
      const numeric = photonCircularRadius({ a: 0, q }, true)
      expect(numeric).toBeCloseTo(photonSphereRNAnalytic(q), 6)
    }
  })

  it('RN extremal (q=1): r_ph = 2', () => {
    expect(photonCircularRadius({ a: 0, q: 1 }, true)).toBeCloseTo(2, 6)
  })
})

describe('ISCO', () => {
  it('Schwarzschild: r_ISCO = 6', () => {
    expect(iscoRadius(SCHWARZSCHILD, true)).toBeCloseTo(6, 6)
  })

  it('coincide con la formula cerrada de Bardeen-Press-Teukolsky para Kerr', () => {
    for (const a of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.95, 0.998]) {
      const numeric = iscoRadius({ a, q: 0 }, true)
      expect(numeric).toBeCloseTo(iscoKerrAnalytic(a, true), 5)
      const numericRetro = iscoRadius({ a, q: 0 }, false)
      expect(numericRetro).toBeCloseTo(iscoKerrAnalytic(a, false), 5)
    }
  })

  it('Kerr extremal: 1 (prograda) y 9 (retrograda)', () => {
    expect(iscoKerrAnalytic(1, true)).toBeCloseTo(1, 10)
    expect(iscoKerrAnalytic(1, false)).toBeCloseTo(9, 10)
    expect(iscoRadius({ a: 0.999999, q: 0 }, true)).toBeLessThan(1.2)
    expect(iscoRadius({ a: 0.999999, q: 0 }, false)).toBeCloseTo(9, 3)
  })

  it('energia en el ISCO de Schwarzschild = 2 sqrt(2)/3', () => {
    const eff = accretionEfficiency(SCHWARZSCHILD, true)
    expect(1 - eff).toBeCloseTo((2 * Math.SQRT2) / 3, 6)
    // Eficiencia clasica del disco delgado de Schwarzschild: 5.72%
    expect(eff).toBeCloseTo(0.0572, 3)
  })

  it('la eficiencia crece con el espin prograde (Kerr extremal ~42%)', () => {
    const e0 = accretionEfficiency({ a: 0, q: 0 }, true)
    const e9 = accretionEfficiency({ a: 0.9, q: 0 }, true)
    const e998 = accretionEfficiency({ a: 0.998, q: 0 }, true)
    expect(e9).toBeGreaterThan(e0)
    expect(e998).toBeGreaterThan(e9)
    expect(e998).toBeGreaterThan(0.3)
    expect(accretionEfficiency({ a: 0.9999999, q: 0 }, true)).toBeGreaterThan(0.4)
  })

  it('la carga acerca el ISCO (mismo espin)', () => {
    const r0 = iscoRadius({ a: 0.5, q: 0 }, true)
    const r1 = iscoRadius({ a: 0.5, q: 0.7 }, true)
    expect(r1).toBeLessThan(r0)
  })

  it('el ISCO esta siempre por fuera de la orbita de fotones y del horizonte', () => {
    for (const a of [0, 0.5, 0.9, -0.6]) {
      for (const q of [0, 0.3, 0.6]) {
        if (a * a + q * q > 1) continue
        const p = { a, q }
        const rIsco = iscoRadius(p, true)
        const rPh = photonCircularRadius(p, true)
        expect(rIsco).toBeGreaterThan(rPh)
        expect(rPh).toBeGreaterThan(horizons(p).rPlus)
      }
    }
  })
})

describe('velocidad angular orbital', () => {
  it('Schwarzschild: Omega = r^{-3/2}', () => {
    for (const r of [6, 10, 30, 100]) {
      expect(circularOmega(r, SCHWARZSCHILD, true)).toBeCloseTo(Math.pow(r, -1.5), 12)
    }
  })

  it('Kerr: Omega = 1/(r^{3/2} + a)', () => {
    for (const a of [0.3, 0.7, 0.998]) {
      for (const r of [4, 8, 20]) {
        const expected = 1 / (Math.pow(r, 1.5) + a)
        expect(circularOmega(r, { a, q: 0 }, true)).toBeCloseTo(expected, 12)
      }
    }
  })

  it('Kerr retrogrado: Omega = -1/(r^{3/2} - a)', () => {
    for (const a of [0.3, 0.7]) {
      for (const r of [8, 20]) {
        const expected = -1 / (Math.pow(r, 1.5) - a)
        expect(circularOmega(r, { a, q: 0 }, false)).toBeCloseTo(expected, 12)
      }
    }
  })
})

describe('borde de la sombra', () => {
  it('Schwarzschild: parametro de impacto critico b_c = sqrt(27) = 3 sqrt(3)', () => {
    expect(criticalImpactParameterStatic(SCHWARZSCHILD)).toBeCloseTo(Math.sqrt(27), 10)
    expect(criticalImpactParameterStatic(SCHWARZSCHILD)).toBeCloseTo(3 * Math.sqrt(3), 10)
  })

  it('Reissner-Nordstrom extremal (q=1): b_c = 4', () => {
    expect(criticalImpactParameterStatic({ a: 0, q: 1 })).toBeCloseTo(4, 10)
  })

  it('las expresiones Kerr-Newman coinciden con las de Bardeen para q = 0', () => {
    for (const a of [0.2, 0.5, 0.9, 0.998]) {
      for (const r of [1.5, 2, 2.5, 3, 3.5, 4]) {
        const mine = criticalImpactParams(r, { a, q: 0 })
        const bardeen = criticalImpactParamsBardeenKerr(r, a)
        expect(mine.xi).toBeCloseTo(bardeen.xi, 9)
        expect(mine.eta).toBeCloseTo(bardeen.eta, 8)
      }
    }
  })

  it('para a -> 0 el borde tiende a un circulo de radio sqrt(27)', () => {
    const m = shadowMetrics({ a: 1e-4, q: 0 }, Math.PI / 2, 2048)
    expect(m.rAreal).toBeCloseTo(Math.sqrt(27), 3)
    expect(m.asymmetry).toBeLessThan(1e-3)
  })

  it('el espin desplaza el centroide y asimetriza la sombra (vista de canto)', () => {
    const low = shadowMetrics({ a: 0.1, q: 0 }, Math.PI / 2, 2048)
    const high = shadowMetrics({ a: 0.998, q: 0 }, Math.PI / 2, 2048)
    expect(Math.abs(high.centroidAlpha)).toBeGreaterThan(Math.abs(low.centroidAlpha))
    expect(high.asymmetry).toBeGreaterThan(low.asymmetry)
    // El borde plano del lado prograde: radio minimo notablemente menor.
    expect(high.rMin).toBeLessThan(high.rMax * 0.95)
  })

  it('visto desde el polo la sombra es circular incluso con espin maximo', () => {
    const m = shadowMetrics({ a: 0.998, q: 0 }, 0, 1024)
    expect(m.asymmetry).toBeLessThan(1e-6)
    expect(m.centroidAlpha).toBeCloseTo(0, 6)
  })

  it('el radio polar decrece poco con el espin (sqrt(27) -> ~4.83)', () => {
    // La sombra vista de frente al eje sigue siendo circular, y su radio baja
    // solo de 5.196 a ~4.83 entre a = 0 y Kerr extremal.
    expect(polarShadowRadius({ a: 0, q: 0 })).toBeCloseTo(Math.sqrt(27), 10)
    const extremal = polarShadowRadius({ a: 0.999999, q: 0 })
    expect(extremal).toBeGreaterThan(4.5)
    expect(extremal).toBeLessThan(Math.sqrt(27))
    // Monotona decreciente en el espin.
    let prev = Infinity
    for (const a of [0, 0.3, 0.6, 0.9, 0.998]) {
      const rad = polarShadowRadius({ a, q: 0 })
      expect(rad).toBeLessThanOrEqual(prev + 1e-9)
      prev = rad
    }
  })

  it('la carga encoge la sombra monotonamente a espin fijo', () => {
    let prev = Infinity
    for (const q of [0, 0.2, 0.4, 0.6, 0.8, 0.95]) {
      const m = shadowMetrics({ a: 0.3, q }, Math.PI / 2, 1024)
      expect(m.rAreal).toBeLessThan(prev)
      prev = m.rAreal
    }
  })

  it('el espin encoge la sombra respecto a Schwarzschild', () => {
    const s = shadowMetrics({ a: 1e-4, q: 0 }, Math.PI / 2, 1024).rAreal
    const k = shadowMetrics({ a: 0.998, q: 0 }, Math.PI / 2, 1024).rAreal
    expect(k).toBeLessThan(s)
  })

  it('radio angular exacto de la sombra: sin^2(alpha) = 27(1-2/r)/r^2', () => {
    for (const rObs of [10, 30, 100, 1000]) {
      const expected = Math.asin(Math.sqrt((27 * (1 - 2 / rObs)) / (rObs * rObs)))
      expect(shadowAngularRadius(rObs, SCHWARZSCHILD)).toBeCloseTo(expected, 12)
    }
  })

  it('a gran distancia el radio angular tiende a sqrt(27)/r', () => {
    const r = 1e8
    expect(shadowAngularRadius(r, SCHWARZSCHILD) * r).toBeCloseTo(Math.sqrt(27), 5)
  })

  it('la correccion de distancia finita sigue el factor de lapso', () => {
    // La relacion exacta es sobre el SENO del angulo, no sobre el angulo:
    //   sin(alpha) = (b_c / r) sqrt(1 - 2/r + q^2/r^2)
    // Confundir alpha con sin(alpha) introduce un error de sin^2(alpha)/6, que a
    // r = 50 son ya 1.7e-3. Este test verifica la relacion exacta.
    for (const p of [SCHWARZSCHILD, { a: 0, q: 0.6 }]) {
      const bc = criticalImpactParameterStatic(p)
      for (const r of [20, 50, 200, 1000]) {
        const sinAlpha = Math.sin(shadowAngularRadius(r, p))
        const lapse = Math.sqrt(1 - 2 / r + (p.q * p.q) / (r * r))
        expect((sinAlpha * r) / bc).toBeCloseTo(lapse, 12)
      }
    }
    // Y el radio angular a distancia finita es siempre menor que el asintotico.
    for (const r of [20, 50, 200]) {
      expect(shadowAngularRadius(r, SCHWARZSCHILD) * r).toBeLessThan(Math.sqrt(27))
    }
  })
})

describe('deflexion de la luz', () => {
  it('campo debil: alpha -> 4/b', () => {
    // b grande: la deflexion debe seguir 4M/b con error relativo pequeno.
    for (const b of [1e4, 1e5]) {
      const alpha = deflectionAngle(b, SCHWARZSCHILD, 1e9, 1e-12)
      const weak = 4 / b
      expect(Math.abs(alpha / weak - 1)).toBeLessThan(2e-3)
    }
  })

  it('reproduce la serie de deflexion hasta tercer orden', () => {
    // Expansion en M/b:  alpha = 4/b + 15 pi/(4 b^2) + 128/(3 b^3) + O(b^-4).
    // A b = 500 el segundo termino vale 5.9e-3 del primero y el tercero 7.2e-3
    // del segundo, asi que este test distingue la integracion real no solo de la
    // aproximacion de campo debil sino tambien del truncamiento a segundo orden.
    const b = 500
    const alpha = deflectionAngle(b, SCHWARZSCHILD, 1e8, 1e-12)
    const t1 = 4 / b
    const t2 = (15 * Math.PI) / (4 * b * b)
    const t3 = 128 / (3 * b * b * b)

    // Con tres terminos el acuerdo es mucho mejor que con dos.
    expect(Math.abs(alpha / (t1 + t2 + t3) - 1)).toBeLessThan(1e-4)
    expect(Math.abs(alpha / (t1 + t2 + t3) - 1)).toBeLessThan(
      Math.abs(alpha / (t1 + t2) - 1),
    )
    // El residuo sobre primer orden son los terminos 2 y 3 juntos, y el residuo
    // sobre los dos primeros es el tercero: el integrador captura ambos ordenes.
    expect((alpha - t1) / (t2 + t3)).toBeCloseTo(1, 3)
    expect((alpha - t1 - t2) / t3).toBeCloseTo(1, 1)
  })

  it('la deflexion crece al reducir el parametro de impacto', () => {
    const a1 = deflectionAngle(100, SCHWARZSCHILD, 1e7, 1e-12)
    const a2 = deflectionAngle(50, SCHWARZSCHILD, 1e7, 1e-12)
    const a3 = deflectionAngle(20, SCHWARZSCHILD, 1e7, 1e-12)
    expect(a2).toBeGreaterThan(a1)
    expect(a3).toBeGreaterThan(a2)
  })
})

describe('corrimiento total del disco (Doppler + gravitacional)', () => {
  it('con L = 0 reproduce el redshift kepleriano sqrt(1 - 3/r) en Schwarzschild', () => {
    // Un foton emitido sin momento angular desde una orbita circular kepleriana
    // sufre solo el corrimiento debido a u^t = 1/sqrt(1 - 3/r).
    for (const r of [6, 8, 12, 30]) {
      const g = redshiftFactor(r, 1, 0, SCHWARZSCHILD, true)
      expect(g).toBeCloseTo(Math.sqrt(1 - 3 / r), 10)
    }
  })

  it('en el ISCO de Schwarzschild el redshift kepleriano vale sqrt(1/2)', () => {
    expect(redshiftFactor(6, 1, 0, SCHWARZSCHILD, true)).toBeCloseTo(Math.SQRT1_2, 10)
  })

  it('un emisor estatico da el redshift gravitacional puro sqrt(1 - 2/r)', () => {
    for (const r of [3, 6, 20, 100]) {
      expect(staticRedshift(r, SCHWARZSCHILD)).toBeCloseTo(Math.sqrt(1 - 2 / r), 12)
    }
  })

  it('la carga reduce el redshift gravitacional a r fijo', () => {
    // sqrt(1 - 2/r + q^2/r^2) crece con q.
    expect(staticRedshift(6, { a: 0, q: 0.8 })).toBeGreaterThan(staticRedshift(6, SCHWARZSCHILD))
  })

  /**
   * Momento angular maximo de un foton de energia E = 1 emitido en r.
   *
   * Esta acotado porque la direccion local del foton es un vector unitario: el
   * momento azimutal medido localmente, L/r, no puede exceder su energia local
   * E/sqrt(1 - 2/r). Un foton con |L| muy por debajo de este techo sale casi
   * radialmente y apenas recibe impulso Doppler, asi que el beaming hay que
   * evaluarlo cerca del maximo.
   */
  const maxPhotonL = (r: number) => r / Math.sqrt(1 - 2 / r)

  it('el lado que se acerca esta desplazado al azul y el que se aleja al rojo', () => {
    // Con disco prograde (Omega > 0), un foton con L > 0 viaja en el sentido del
    // movimiento del fluido: es el lado que se acerca al observador.
    const p: BHParams = { a: 0.5, q: 0 }
    const r = 8
    const L = 0.85 * maxPhotonL(r)
    const gApproach = redshiftFactor(r, 1, L, p, true)
    const gRecede = redshiftFactor(r, 1, -L, p, true)
    expect(gApproach).toBeGreaterThan(gRecede)
    expect(gApproach).toBeGreaterThan(1) // blueshift real
    expect(gRecede).toBeLessThan(1) // redshift
    // El contraste de brillo en banda visible (Rayleigh-Jeans) va como g.
    expect(gApproach / gRecede).toBeGreaterThan(2)
  })

  it('el contraste tangencial sigue la forma cerrada (sqrt(r-2)+1)/(sqrt(r-2)-1)', () => {
    // Para el foton emitido tangencialmente en Schwarzschild, con L = L_max y
    // E = 1, resulta Omega L_max = 1/sqrt(r-2) exactamente, y el redshift
    // gravitacional se cancela en el cociente entre los dos lados. Queda
    //   g(+)/g(-) = (1 + 1/sqrt(r-2)) / (1 - 1/sqrt(r-2))
    // que en el ISCO de Schwarzschild vale exactamente 3.
    const p: BHParams = { a: 0, q: 0 }
    for (const r of [6, 8, 12, 30, 200]) {
      const L = maxPhotonL(r)
      const measured = redshiftFactor(r, 1, L, p, true) / redshiftFactor(r, 1, -L, p, true)
      const s = Math.sqrt(r - 2)
      expect(measured).toBeCloseTo((s + 1) / (s - 1), 8)
    }
    // En el ISCO el contraste tangencial es exactamente 3.
    const L6 = maxPhotonL(6)
    expect(redshiftFactor(6, 1, L6, p, true) / redshiftFactor(6, 1, -L6, p, true)).toBeCloseTo(3, 8)
    // Y a gran radio se apaga.
    const L200 = maxPhotonL(200)
    expect(
      redshiftFactor(200, 1, L200, p, true) / redshiftFactor(200, 1, -L200, p, true),
    ).toBeLessThan(1.2)
  })

  it('g crece monotonamente con L', () => {
    const p: BHParams = { a: 0.7, q: 0.2 }
    let prev = -Infinity
    for (const L of [-4, -2, 0, 2, 4]) {
      const g = redshiftFactor(9, 1, L, p, true)
      expect(g).toBeGreaterThan(prev)
      prev = g
    }
  })

  it('el contraste del beaming crece monotonamente al acercarse al agujero', () => {
    // La velocidad orbital crece hacia dentro, asi que la separacion entre el
    // lado que se acerca y el que se aleja tiene que aumentar.
    const p: BHParams = { a: 0, q: 0 }
    const contrast = (r: number) => {
      const L = 0.85 * maxPhotonL(r)
      return redshiftFactor(r, 1, L, p, true) / redshiftFactor(r, 1, -L, p, true)
    }
    let prev = Infinity
    for (const r of [7, 10, 15, 25, 40, 100]) {
      const c = contrast(r)
      expect(c).toBeLessThan(prev)
      prev = c
    }
  })

  it('lejos del agujero y con L pequeno el corrimiento tiende a 1', () => {
    expect(redshiftFactor(1e5, 1, 0, SCHWARZSCHILD, true)).toBeCloseTo(1, 4)
  })
})

describe('ley de Planck', () => {
  it('un cuerpo negro con corrimiento g es un cuerpo negro a temperatura g T', () => {
    // Identidad clave que justifica consultar la LUT en g*T:
    //   g^3 B_nu(nu/g, T) = B_nu(nu, g T)
    const T = 1e5
    for (const g of [0.3, 0.7, 1, 1.5, 3]) {
      for (const nu of [1e14, 5e14, 1e15]) {
        const lhs = Math.pow(g, 3) * planckSpectralNu(nu / g, T)
        const rhs = planckSpectralNu(nu, g * T)
        expect(lhs / rhs).toBeCloseTo(1, 10)
      }
    }
  })
})
