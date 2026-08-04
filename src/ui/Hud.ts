/**
 * HUD de observables en vivo. Todo se recalcula en CPU desde kerrNewman.ts en
 * cada cambio de parametro, con las mismas funciones que valida la suite de
 * tests: los numeros de aqui son los que estan comprobados contra las formulas
 * cerradas.
 */

import { visibleFraction, wienPeakWavelength } from '../physics/blackbody'
import { staticLapse } from '../physics/embedding'
import { ChirpAudio } from './ChirpAudio'
import { formatLength, formatTime, radToMicroArcsec } from '../physics/units'
import type { Derived, ParamStore, SimParams } from '../state/params'
import { hudGroup, hudRow, num, sci } from './widgets'

type Row = ReturnType<typeof hudRow>

export class Hud {
  private rows = new Map<string, Row>()

  constructor(
    private root: HTMLElement,
    store: ParamStore,
  ) {
    this.build()
    store.subscribe((p, d) => this.update(p, d))
  }

  private add(group: HTMLElement, key: string, symbol: string, desc: string, title?: string): void {
    const r = hudRow(symbol, desc, title)
    this.rows.set(key, r)
    group.appendChild(r.root)
  }

  private build(): void {
    const geom = hudGroup('Geometría')
    this.add(geom, 'extremality', 'a²+q²', 'extremalidad', 'Debe ser ≤ 1 para que exista horizonte')
    this.add(geom, 'rPlus', 'r₊', 'horizonte de sucesos')
    this.add(
      geom,
      'rMinus',
      'r₋',
      'horizonte de Cauchy',
      'Interior a r₊: causalmente inaccesible, no se puede observar',
    )
    this.add(geom, 'rErgoEq', 'r_E', 'ergosfera (ecuador)')
    this.add(geom, 'rErgoPole', 'r_E', 'ergosfera (polo)', 'Coincide con r₊ en el eje')
    this.add(geom, 'kappa', 'κ', 'gravedad superficial', 'Vale 1/4 para Schwarzschild')
    this.add(geom, 'area', 'A_H', 'área del horizonte')

    const orb = hudGroup('Órbitas')
    this.add(orb, 'rPhPro', 'r_ph', 'fotones (prógrada)', 'Vale 3 M para Schwarzschild')
    this.add(orb, 'rPhRetro', 'r_ph', 'fotones (retrógrada)')
    this.add(orb, 'rIscoPro', 'r_ISCO', 'ISCO prógrado', 'Vale 6 M para Schwarzschild')
    this.add(orb, 'rIscoRetro', 'r_ISCO', 'ISCO retrógrado')
    this.add(orb, 'eff', 'η', 'eficiencia de acreción', '1 − E_ISCO; 5.72% para Schwarzschild')
    this.add(orb, 'iscoPeriod', 'T_ISCO', 'periodo orbital')

    const shadow = hudGroup('Sombra')
    this.add(
      shadow,
      'shadowAreal',
      'R_s',
      'radio areal',
      'En unidades de M/r_obs. Vale √27 = 5.196 para Schwarzschild',
    )
    this.add(shadow, 'shadowAsym', 'Δ', 'asimetría', '(máx − mín)/(máx + mín); 0 = circular')
    this.add(shadow, 'shadowAng', 'θ_s', 'radio angular')

    const cam = hudGroup('Observador')
    this.add(cam, 'camDist', 'r_obs', 'distancia')
    this.add(cam, 'camDistPhys', '', 'distancia física')
    this.add(cam, 'lapse', 'α', 'dilatación temporal', 'Lapso ZAMO dτ/dt en la cámara')
    this.add(cam, 'omega', 'ω', 'arrastre de marcos', 'dφ/dt del marco local en la cámara')

    const disk = hudGroup('Disco')
    this.add(disk, 'tmax', 'T_máx', 'temperatura máxima')
    this.add(disk, 'wien', 'λ_pico', 'pico de Wien')
    this.add(disk, 'visfrac', 'f_vis', 'fracción visible', 'Parte del flujo bolométrico en 360–830 nm')
    this.add(disk, 'rin', 'r_in', 'borde interno')

    const scale = hudGroup('Escalas físicas')
    this.add(scale, 'rg', 'r_g', 'radio gravitacional', 'GM/c² = 1.477 km × (M/M☉)')
    this.add(scale, 'rs', 'r_s', 'radio de Schwarzschild', '2GM/c²')
    this.add(scale, 'tg', 't_g', 'tiempo gravitacional', 'GM/c³')
    this.add(scale, 'thawking', 'T_H', 'temperatura de Hawking')

    const bin = hudGroup('Binaria')
    bin.dataset.onlyMode = 'binary'
    this.add(bin, 'binM', 'm₁/m₂', 'masas de puntura', 'En unidades de la masa ADM total, que para Brill-Lindquist es m₁+m₂')
    this.add(bin, 'binSep', 'a', 'separación coordenada')
    this.add(bin, 'binProper', 'ℓ', 'separación propia', 'Distancia propia entre horizontes: mayor que la coordenada')
    this.add(bin, 'binHor', 'r₊', 'horizontes isótropos', 'Cada uno en r = m/2')
    this.add(bin, 'binMc', 'M_c', 'masa de chirp', '(m₁m₂)^(3/5)/M^(1/5): el parámetro que fija el inspiral')
    this.add(bin, 'binF', 'f_gw', 'frecuencia de la onda')
    this.add(bin, 'binFCut', 'f_corte', 'corte del modelo', 'El inspiral post-newtoniano deja de valer en a = 6M')
    this.add(bin, 'binMerge', 't_c', 'tiempo a la fusión')
    this.add(bin, 'binChirp', '♪', 'chirp audible')

    const mesh = hudGroup('Malla')
    mesh.dataset.onlyMode = 'mesh'
    this.add(mesh, 'meshDepth', 'z', 'profundidad de la garganta')
    this.add(
      mesh,
      'meshProper',
      'ℓ',
      'distancia propia r₊→10M',
      'Comparar con la diferencia de coordenadas: la malla se estira de verdad',
    )
    this.add(mesh, 'meshCoord', 'Δr', 'diferencia coordenada')
    this.add(
      mesh,
      'meshHorEmb',
      '—',
      'horizonte sumergible',
      'Con a/M > √3/2 ≈ 0.866 el horizonte no cabe en espacio euclídeo (Smarr 1973)',
    )
    this.add(mesh, 'meshLapseH', 'α', 'lapso en r = 3M', 'Ritmo del tiempo propio frente al coordenado')

    this.root.append(geom, orb, shadow, cam, disk, bin, mesh, scale)
  }

  private update(p: SimParams, d: Derived): void {
    const set = (k: string, v: string, dim = false) => this.rows.get(k)?.set(v, dim)
    const noHorizon = !d.hasHorizon

    // Grupos que solo aplican a ciertos modos de visualizacion.
    for (const node of this.root.querySelectorAll<HTMLElement>('[data-only-mode]')) {
      node.style.display = (node.dataset.onlyMode ?? '').split(/\s+/).includes(p.mode) ? '' : 'none'
    }

    // --- Geometría ---------------------------------------------------------
    set('extremality', num(d.extremality, 4), false)
    const extRow = this.rows.get('extremality')
    if (extRow) {
      extRow.root.style.color = d.extremality > 1 ? 'var(--danger)' : ''
    }
    set('rPlus', noHorizon ? 'sin horizonte' : `${num(d.rPlus)} M`, noHorizon)
    set('rMinus', noHorizon ? 'sin horizonte' : `${num(d.rMinus)} M`, true)
    set('rErgoEq', `${num(d.rErgoEquator)} M`)
    set('rErgoPole', `${num(d.rErgoPole)} M`)
    set('kappa', noHorizon ? '—' : `${num(d.surfaceGravity, 4)} /M`, noHorizon)
    set(
      'area',
      noHorizon ? '—' : `${num(4 * Math.PI * (d.rPlus * d.rPlus + d.bh.a * d.bh.a), 2)} M²`,
      noHorizon,
    )

    // --- Órbitas -----------------------------------------------------------
    set('rPhPro', `${num(d.rPhotonPrograde)} M`)
    set('rPhRetro', `${num(d.rPhotonRetrograde)} M`)
    set('rIscoPro', `${num(d.rIscoPrograde)} M`)
    set('rIscoRetro', `${num(d.rIscoRetrograde)} M`)
    set('eff', `${(d.efficiency * 100).toFixed(2)} %`)
    set('iscoPeriod', formatTime(d.iscoPeriodSeconds))

    // --- Sombra ------------------------------------------------------------
    set('shadowAreal', noHorizon ? 'no hay sombra' : `${num(d.shadowArealRadius)} M`, noHorizon)
    set('shadowAsym', noHorizon ? '—' : num(d.shadowAsymmetry, 4), noHorizon)
    const uas = radToMicroArcsec(d.shadowAngularRad)
    set(
      'shadowAng',
      noHorizon
        ? '—'
        : uas < 1000
          ? `${sci(uas)} µas`
          : `${sci(d.shadowAngularRad * 1e3)} mrad`,
      noHorizon,
    )

    // --- Observador --------------------------------------------------------
    set('camDist', `${num(d.camDistanceRg, 2)} M`)
    set('camDistPhys', formatLength(d.camDistanceRg * d.rgMeters), true)
    set('lapse', num(d.camLapse, 4))
    set('omega', `${sci(d.camOmega)} /M`)

    // --- Disco -------------------------------------------------------------
    if (p.diskEnabled) {
      set('tmax', `${sci(d.diskTempMaxK)} K`)
      set('wien', `${sci(wienPeakWavelength(d.diskTempMaxK) * 1e9)} nm`)
      set('visfrac', `${(visibleFraction(d.diskTempMaxK) * 100).toPrecision(3)} %`)
      set('rin', `${num(d.rDiskInner)} M`)
    } else {
      for (const k of ['tmax', 'wien', 'visfrac', 'rin']) set(k, 'disco apagado', true)
    }

    // --- Binaria -----------------------------------------------------------
    set('binM', `${d.binaryM1.toFixed(3)} / ${d.binaryM2.toFixed(3)}`)
    set('binSep', `${p.binarySeparation.toFixed(1)} M`)
    set('binProper', `${d.binaryProperSeparation.toFixed(1)} M`)
    set('binHor', `${d.binaryR1.toFixed(3)} / ${d.binaryR2.toFixed(3)} M`)
    set('binMc', `${d.chirpMassGeom.toFixed(4)} M · ${sci(d.chirpMassSolar)} M☉`)
    set('binF', `${sci(d.gwFrequencyHz)} Hz`)
    set('binFCut', `${sci(d.cutoffFrequencyHz)} Hz`)
    set(
      'binMerge',
      d.mergerTimeSeconds > 0 ? formatTime(d.mergerTimeSeconds) : 'ya en fusión',
      d.mergerTimeSeconds <= 0,
    )
    const audible = ChirpAudio.toAudible(d.gwFrequencyHz)
    set(
      'binChirp',
      p.chirpAudio
        ? audible.octaveShift === 0
          ? `${audible.playedHz.toFixed(1)} Hz (real)`
          : `${audible.playedHz.toFixed(1)} Hz (${audible.octaveShift > 0 ? '+' : ''}${audible.octaveShift} oct)`
        : 'apagado',
      !p.chirpAudio,
    )

    // --- Malla -------------------------------------------------------------
    set('meshDepth', `${num(d.meshDepth, 2)} M`)
    set('meshProper', Number.isFinite(d.properDistanceToTen) ? `${num(d.properDistanceToTen, 2)} M` : '—')
    set('meshCoord', d.hasHorizon ? `${num(10 - d.rPlus, 2)} M` : '—', true)
    set(
      'meshHorEmb',
      d.hasHorizon ? (d.horizonEmbeddingFails ? 'NO (a/M > √3/2)' : 'sí') : '—',
    )
    const hEmb = this.rows.get('meshHorEmb')
    if (hEmb) hEmb.root.style.color = d.horizonEmbeddingFails ? 'var(--warn)' : ''
    set('meshLapseH', num(staticLapse(3, d.bh), 4))

    // --- Escalas físicas ---------------------------------------------------
    set('rg', formatLength(d.rgMeters))
    set('rs', formatLength(2 * d.rgMeters))
    set('tg', formatTime(d.tgSeconds))
    set(
      'thawking',
      Number.isFinite(d.hawkingTempK) ? `${sci(d.hawkingTempK)} K` : '—',
      !Number.isFinite(d.hawkingTempK),
    )
  }
}
