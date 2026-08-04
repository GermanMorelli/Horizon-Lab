/**
 * Panel de control. Cada control escribe en el ParamStore; la reconciliacion
 * con la camara orbital la hace main.ts.
 */

import { formatLength, formatMass, PARSEC } from '../physics/units'
import { SPIN_LIMIT, type DistanceMode, type ParamStore, type SimParams } from '../state/params'
import { PRESETS, type Preset } from './Presets'
import {
  button,
  el,
  note,
  section,
  segmented,
  slider,
  toggle,
  type SegmentedHandle,
  type SliderHandle,
  type ToggleHandle,
} from './widgets'

const DEG = 180 / Math.PI

export interface ControlPanelOptions {
  store: ParamStore
  onPreset: (p: Preset) => void
  onScreenshot: () => void
  onResetView: () => void
  onToggleHud: () => void
  /** Lanza una particula de prueba con los parametros actuales. */
  onLaunchOrbit: () => void
  onClearOrbits: () => void
}

export class ControlPanel {
  private sliders = new Map<string, SliderHandle>()
  private toggles = new Map<string, ToggleHandle>()
  private distMode!: SegmentedHandle<DistanceMode>
  private diskDir!: SegmentedHandle<'pro' | 'retro'>
  private orbitDir!: SegmentedHandle<'pro' | 'retro'>
  private distSlider!: SliderHandle
  private syncing = false

  constructor(
    private root: HTMLElement,
    private opts: ControlPanelOptions,
  ) {
    this.build()
    opts.store.subscribe(() => this.sync())
  }

  private get p(): Readonly<SimParams> {
    return this.opts.store.get()
  }

  private patch(patch: Partial<SimParams>): void {
    if (this.syncing) return
    this.opts.store.patch(patch)
  }

  private build(): void {
    this.root.append(
      this.buildPresets(),
      this.buildBlackHole(),
      this.buildCamera(),
      this.buildDisk(),
      this.buildBackground(),
      this.buildLayers(),
      this.buildOrbits(),
      this.buildRender(),
    )
  }

  // -------------------------------------------------------------------------

  private buildOrbits(): HTMLElement {
    const s = section('Órbitas de prueba', false)

    const show = toggle('Mostrar órbitas', this.p.showOrbits, (v) =>
      this.patch({ showOrbits: v }),
    )
    this.toggles.set('showOrbits', show)

    const radius = slider({
      label: 'Radio de lanzamiento',
      symbol: 'r₀',
      min: 1.5,
      max: 80,
      step: 0.1,
      value: this.p.orbitLaunchRadius,
      format: (v) => `${v.toFixed(1)} M`,
      onInput: (v) => this.patch({ orbitLaunchRadius: v }),
    })
    this.sliders.set('orbitLaunchRadius', radius)

    const incl = slider({
      label: 'Inclinación de la órbita',
      min: 0,
      max: 85,
      step: 1,
      value: this.p.orbitInclination * DEG,
      format: (v) => `${v.toFixed(0)}°`,
      onInput: (v) => this.patch({ orbitInclination: v / DEG }),
    })
    this.sliders.set('orbitInclination', incl)

    const speed = slider({
      label: 'Velocidad',
      symbol: 'v/v_circ',
      min: 0.4,
      max: 1.35,
      step: 0.005,
      value: this.p.orbitSpeedFraction,
      format: (v) => `${v.toFixed(3)}×`,
      onInput: (v) => this.patch({ orbitSpeedFraction: v }),
    })
    this.sliders.set('orbitSpeedFraction', speed)

    const charge = slider({
      label: 'Carga de la partícula',
      symbol: 'e/m',
      min: -2,
      max: 2,
      step: 0.02,
      value: this.p.orbitCharge,
      format: (v) => (v === 0 ? 'neutra' : v.toFixed(2)),
      onInput: (v) => this.patch({ orbitCharge: v }),
    })
    this.sliders.set('orbitCharge', charge)

    const revs = slider({
      label: 'Revoluciones',
      min: 1,
      max: 40,
      step: 1,
      value: this.p.orbitRevolutions,
      format: (v) => v.toFixed(0),
      onInput: (v) => this.patch({ orbitRevolutions: Math.round(v) }),
    })
    this.sliders.set('orbitRevolutions', revs)

    const op = slider({
      label: 'Opacidad',
      min: 0.05,
      max: 1,
      step: 0.02,
      value: this.p.orbitOpacity,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ orbitOpacity: v }),
    })
    this.sliders.set('orbitOpacity', op)

    const dir = segmented<'pro' | 'retro'>(
      [
        { value: 'pro', label: 'prógrada' },
        { value: 'retro', label: 'retrógrada' },
      ],
      this.p.orbitPrograde ? 'pro' : 'retro',
      (v) => this.patch({ orbitPrograde: v === 'pro' }),
    )
    this.orbitDir = dir

    const actions = el('div', 'btn-row')
    actions.append(
      button('Lanzar partícula', () => this.opts.onLaunchOrbit()),
      button('Borrar todas', () => this.opts.onClearOrbits()),
    )

    s.body.append(
      show.root,
      note(
        '<b>Vista esquemática.</b> Estas líneas se proyectan suponiendo que la luz viaja en ' +
          'línea recta, mientras que la imagen de fondo sí sigue geodésicas. Son un diagrama ' +
          'en el espacio de coordenadas superpuesto a una observación: una órbita que pase ' +
          'por detrás del agujero <em>debería</em> verse deformada por el lente, y aquí ' +
          'aparece recta. Sí se atenúan al pasar tras el horizonte.',
      ),
      radius.root,
      incl.root,
      speed.root,
      dir.root,
      charge.root,
      revs.root,
      op.root,
      actions,
      note(
        'La carga de la <em>partícula</em> es el único lugar donde <code>Q</code> actúa ' +
          'electromagnéticamente: los fotones son neutros y solo la sienten a través de la ' +
          'métrica. Con <code>Q/M > 0</code> y carga no nula, la partícula se desvía de la ' +
          'geodésica por la fuerza de Lorentz del potencial ' +
          '<code>A_μ = −(Qr/Σ)(dt − a sin²θ dφ)</code>.',
      ),
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildPresets(): HTMLElement {
    const s = section('Presets', true)
    const grid = el('div', 'presets')
    for (const preset of PRESETS) {
      const b = el('button')
      b.appendChild(el('b', undefined, preset.name))
      b.appendChild(el('span', undefined, preset.subtitle))
      b.title = preset.info ?? ''
      b.addEventListener('click', () => this.opts.onPreset(preset))
      grid.appendChild(b)
    }
    const row = el('div', 'btn-row')
    row.append(
      button('Vista inicial', () => this.opts.onResetView()),
      button('Capturar PNG', () => this.opts.onScreenshot()),
      button('HUD', () => this.opts.onToggleHud(), 'Mostrar u ocultar el panel de observables'),
    )
    s.body.append(grid, row)
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildBlackHole(): HTMLElement {
    const s = section('Agujero negro', true)

    const mass = slider({
      label: 'Masa',
      symbol: 'M',
      min: 1,
      max: 1e11,
      value: this.p.massSolar,
      log: true,
      format: (v) => formatMass(v),
      onInput: (v) => this.patch({ massSolar: v }),
    })
    this.sliders.set('massSolar', mass)

    const spin = slider({
      label: 'Momento angular',
      symbol: 'a/M',
      min: -SPIN_LIMIT,
      max: SPIN_LIMIT,
      step: 0.001,
      value: this.p.spin,
      format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(3)}`,
      onInput: (v) => this.patch({ spin: v }),
    })
    this.sliders.set('spin', spin)

    const charge = slider({
      label: 'Carga eléctrica',
      symbol: 'Q/M',
      min: 0,
      max: 1.2,
      step: 0.001,
      value: this.p.charge,
      format: (v) => v.toFixed(3),
      onInput: (v) => this.patch({ charge: v }),
    })
    this.sliders.set('charge', charge)

    s.body.append(
      mass.root,
      note(
        'La <b>forma</b> de la imagen depende solo de <code>a/M</code> y <code>Q/M</code>: ' +
          'la masa es el factor de escala. Actúa por el tamaño angular (en modo distancia ' +
          'física), la temperatura del disco <code>T ∝ M^−1/4</code> y el periodo orbital ' +
          '<code>T ∝ M</code>.',
      ),
      spin.root,
      charge.root,
      note(
        'Los agujeros negros reales son neutros: el plasma circundante los descarga hasta ' +
          '<code>Q/M ~ 10⁻¹⁸</code>. Kerr-Newman es exacto como solución de ' +
          'Einstein-Maxwell, pero no astrofísico. La carga contrae los horizontes vía ' +
          '<code>Δ = r² − 2Mr + a² + Q²</code>.',
      ),
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildCamera(): HTMLElement {
    const s = section('Cámara', true)

    const incl = slider({
      label: 'Inclinación',
      symbol: 'i',
      min: 1,
      max: 179,
      step: 0.5,
      value: this.p.inclination * DEG,
      format: (v) => `${v.toFixed(1)}°`,
      onInput: (v) => this.patch({ inclination: v / DEG }),
    })
    this.sliders.set('inclination', incl)

    this.distMode = segmented<DistanceMode>(
      [
        { value: 'rg', label: 'en radios r_g', title: 'La geometría no cambia con la masa' },
        { value: 'physical', label: 'distancia física', title: 'La masa cambia el tamaño angular' },
      ],
      this.p.distanceMode,
      (v) => this.patch({ distanceMode: v }),
    )

    this.distSlider = slider({
      label: 'Distancia',
      symbol: 'r',
      min: 2.2,
      max: 400,
      step: 0.1,
      value: this.p.distanceRg,
      format: (v) => `${v.toFixed(1)} M`,
      onInput: (v) => this.patch({ distanceRg: v }),
    })

    const distPhys = slider({
      label: 'Distancia física',
      symbol: 'D',
      min: 1e9,
      max: 1e26,
      value: this.p.distanceMeters,
      log: true,
      format: (v) => formatLength(v),
      onInput: (v) => this.patch({ distanceMeters: v }),
    })
    this.sliders.set('distanceMeters', distPhys)

    const fov = slider({
      label: 'Campo de visión',
      symbol: 'fov',
      min: 4,
      max: 110,
      step: 0.5,
      value: this.p.fov * DEG,
      format: (v) => `${v.toFixed(0)}°`,
      onInput: (v) => this.patch({ fov: v / DEG }),
    })
    this.sliders.set('fov', fov)

    s.body.append(
      note('Arrastra sobre la imagen para orbitar. Rueda o pinza para acercarte.'),
      incl.root,
      this.distMode.root,
      this.distSlider.root,
      distPhys.root,
      fov.root,
    )
    // Guardar referencias para mostrar/ocultar segun el modo.
    this.distSlider.root.dataset.mode = 'rg'
    distPhys.root.dataset.mode = 'physical'
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildDisk(): HTMLElement {
    const s = section('Disco de acreción', true)

    const enabled = toggle('Disco activo', this.p.diskEnabled, (v) =>
      this.patch({ diskEnabled: v }),
    )
    this.toggles.set('diskEnabled', enabled)

    const outer = slider({
      label: 'Radio externo',
      symbol: 'r_out',
      min: 4,
      max: 120,
      step: 0.5,
      value: this.p.diskOuter,
      format: (v) => `${v.toFixed(1)} M`,
      onInput: (v) => this.patch({ diskOuter: v }),
    })
    this.sliders.set('diskOuter', outer)

    const edd = slider({
      label: 'Tasa de acreción',
      symbol: 'ṁ/ṁ_E',
      min: 1e-9,
      max: 1,
      value: this.p.eddingtonRatio,
      log: true,
      format: (v) => (v >= 0.01 ? v.toFixed(3) : v.toExponential(1)),
      onInput: (v) => this.patch({ eddingtonRatio: v }),
    })
    this.sliders.set('eddingtonRatio', edd)

    const opacity = slider({
      label: 'Opacidad',
      symbol: 'τ',
      min: 0.05,
      max: 1,
      step: 0.01,
      value: this.p.diskOpacity,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ diskOpacity: v }),
    })
    this.sliders.set('diskOpacity', opacity)

    const warp = slider({
      label: 'Velocidad de rotación',
      symbol: '×t',
      min: 0,
      max: 8,
      step: 0.05,
      value: this.p.timeWarp,
      format: (v) => (v === 0 ? 'pausado' : `${v.toFixed(2)}×`),
      onInput: (v) => this.patch({ timeWarp: v }),
    })
    this.sliders.set('timeWarp', warp)

    this.diskDir = segmented<'pro' | 'retro'>(
      [
        { value: 'pro', label: 'corrotante', title: 'El disco gira con el espín' },
        { value: 'retro', label: 'contrarrotante', title: 'El disco gira contra el espín' },
      ],
      this.p.diskPrograde ? 'pro' : 'retro',
      (v) => this.patch({ diskPrograde: v === 'pro' }),
    )

    const turb = toggle('Estructura turbulenta', this.p.diskTurbulence, (v) =>
      this.patch({ diskTurbulence: v }),
    )
    this.toggles.set('diskTurbulence', turb)

    s.body.append(
      enabled.root,
      note(
        'Borde interno fijado en el <b>ISCO</b>. Perfil de Novikov-Thorne ' +
          '<code>T ∝ r^−3/4 [1−√(r_in/r)]^1/4</code>, color de cuerpo negro por ley de ' +
          'Planck, y corrimiento total <code>g</code> que engloba Doppler y redshift ' +
          'gravitacional: de ahí el lado brillante.',
      ),
      outer.root,
      edd.root,
      note(
        'El contraste del beaming depende de la temperatura. La radiación observada de un ' +
          'cuerpo negro con corrimiento <code>g</code> es exactamente un cuerpo negro a ' +
          '<code>g·T</code>. Si el pico de Wien está muy por debajo del visible (disco caliente), ' +
          'la banda visible está en régimen de Rayleigh-Jeans y el contraste va como ' +
          '<code>g</code>; el conocido <code>g⁴</code> es el valor <b>bolométrico</b>. ' +
          'Baja la tasa de acreción hasta <code>T ~ 6000 K</code> y el pico entra en el visible: ' +
          'la asimetría se vuelve exponencialmente más marcada.',
      ),
      opacity.root,
      this.diskDir.root,
      warp.root,
      turb.root,
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildBackground(): HTMLElement {
    const s = section('Fondo estelar', false)

    const stars = toggle('Estrellas', this.p.starsEnabled, (v) => this.patch({ starsEnabled: v }))
    this.toggles.set('starsEnabled', stars)

    const intensity = slider({
      label: 'Brillo estelar',
      min: 0,
      max: 4,
      step: 0.05,
      value: this.p.starIntensity,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ starIntensity: v }),
    })
    this.sliders.set('starIntensity', intensity)

    const density = slider({
      label: 'Densidad',
      min: 0.05,
      max: 1,
      step: 0.01,
      value: this.p.starDensity,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ starDensity: v }),
    })
    this.sliders.set('starDensity', density)

    const mw = slider({
      label: 'Banda galáctica',
      min: 0,
      max: 2,
      step: 0.02,
      value: this.p.milkyWayIntensity,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ milkyWayIntensity: v }),
    })
    this.sliders.set('milkyWayIntensity', mw)

    s.body.append(
      stars.root,
      note(
        'El fondo se deflecta con las geodésicas reales: los arcos y las imágenes ' +
          'múltiples alrededor de la sombra son <b>anillos de Einstein</b>, no un efecto ' +
          'de dibujado. El color de cada estrella sale de la misma LUT de cuerpo negro ' +
          'que el disco.',
      ),
      intensity.root,
      density.root,
      mw.root,
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildLayers(): HTMLElement {
    const s = section('Capas geométricas', false)

    const defs: Array<[keyof SimParams, string, string]> = [
      ['showHorizon', 'Horizonte de sucesos', 'Rejilla sobre r₊, donde el rayo es capturado'],
      ['showErgosphere', 'Ergosfera', 'r_E(θ) = 1 + √(1 − q² − a²cos²θ): se achata con el espín'],
      ['showPhotonSphere', 'Esfera de fotones', 'Órbita circular de fotones'],
      ['showIsco', 'ISCO', 'Última órbita circular estable'],
      ['showDragGrid', 'Malla de arrastre', 'Rejilla de coordenadas coloreada por ω'],
    ]

    for (const [key, label, title] of defs) {
      const t = toggle(label, this.p[key] as boolean, (v) =>
        this.patch({ [key]: v } as Partial<SimParams>),
      )
      t.root.title = title
      this.toggles.set(key, t)
      s.body.appendChild(t.root)
    }

    const gridR = slider({
      label: 'Radio de la malla',
      symbol: 'r',
      min: 2,
      max: 40,
      step: 0.1,
      value: this.p.dragGridRadius,
      format: (v) => `${v.toFixed(1)} M`,
      onInput: (v) => this.patch({ dragGridRadius: v }),
    })
    this.sliders.set('dragGridRadius', gridR)

    const op = slider({
      label: 'Opacidad de capas',
      min: 0,
      max: 1.5,
      step: 0.02,
      value: this.p.layerOpacity,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ layerOpacity: v }),
    })
    this.sliders.set('layerOpacity', op)

    s.body.append(
      gridR.root,
      op.root,
      note(
        'Estas superficies se detectan <b>dentro</b> del trazador, en los cruces reales del ' +
          'rayo: aparecen con su lente gravitacional correcto, no como un dibujo encima. ' +
          'El horizonte de Cauchy (r₋) no se puede dibujar: está dentro de r₊ y ningún ' +
          'rayo lo alcanza, así que solo se reporta como número.',
      ),
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildRender(): HTMLElement {
    const s = section('Render', false)

    const rs = slider({
      label: 'Resolución (reposo)',
      min: 0.25,
      max: 1,
      step: 0.05,
      value: this.p.renderScale,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      onInput: (v) => this.patch({ renderScale: v }),
    })
    this.sliders.set('renderScale', rs)

    const is = slider({
      label: 'Resolución (arrastrando)',
      min: 0.15,
      max: 1,
      step: 0.05,
      value: this.p.interactiveScale,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      onInput: (v) => this.patch({ interactiveScale: v }),
    })
    this.sliders.set('interactiveScale', is)

    const iter = slider({
      label: 'Iteraciones por rayo',
      symbol: 'máx',
      min: 150,
      max: 3000,
      step: 10,
      value: this.p.maxIter,
      format: (v) => v.toFixed(0),
      onInput: (v) => this.patch({ maxIter: Math.round(v) }),
    })
    this.sliders.set('maxIter', iter)

    const tol = slider({
      label: 'Tolerancia del integrador',
      symbol: 'tol',
      min: 1e-7,
      max: 1e-3,
      value: this.p.tolerance,
      log: true,
      format: (v) => v.toExponential(1),
      onInput: (v) => this.patch({ tolerance: v }),
    })
    this.sliders.set('tolerance', tol)

    const samples = slider({
      label: 'Muestras acumuladas',
      symbol: 'spp',
      min: 1,
      max: 512,
      step: 1,
      value: this.p.targetSamples,
      format: (v) => v.toFixed(0),
      onInput: (v) => this.patch({ targetSamples: Math.round(v) }),
    })
    this.sliders.set('targetSamples', samples)

    const exp = slider({
      label: 'Exposición',
      min: 0.02,
      max: 20,
      value: this.p.exposure,
      log: true,
      format: (v) => `${v.toFixed(2)}×`,
      onInput: (v) => this.patch({ exposure: v }),
    })
    this.sliders.set('exposure', exp)

    const autoExp = toggle('Exposición automática', this.p.autoExposure, (v) =>
      this.patch({ autoExposure: v }),
    )
    autoExp.root.title =
      'Compensa que la radiancia visible crece ~lineal con T. Desactívala para ver el ' +
      'brillo relativo físico entre masas.'
    this.toggles.set('autoExposure', autoExp)

    const bloom = toggle('Bloom', this.p.bloomEnabled, (v) => this.patch({ bloomEnabled: v }))
    this.toggles.set('bloomEnabled', bloom)

    const bloomS = slider({
      label: 'Intensidad del bloom',
      min: 0,
      max: 2,
      step: 0.02,
      value: this.p.bloomStrength,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ bloomStrength: v }),
    })
    this.sliders.set('bloomStrength', bloomS)

    const autoQ = toggle('Calidad adaptativa', this.p.autoQuality, (v) =>
      this.patch({ autoQuality: v }),
    )
    autoQ.root.title =
      'Baja la resolución interna si la GPU no llega. Conviene dejarlo activo: un pase demasiado ' +
      'lento puede hacer que el driver reinicie la GPU y el canvas se quede en negro.'
    this.toggles.set('autoQuality', autoQ)

    const diag = toggle('Diagnóstico: rayos sin converger', this.p.markNonConverged, (v) =>
      this.patch({ markNonConverged: v }),
    )
    diag.root.title =
      'Pinta de magenta los píxeles que agotaron el presupuesto de iteraciones. Si aparecen, ' +
      'sube «Iteraciones por rayo».'
    this.toggles.set('markNonConverged', diag)

    s.body.append(
      rs.root,
      is.root,
      iter.root,
      tol.root,
      samples.root,
      exp.root,
      autoExp.root,
      bloom.root,
      bloomS.root,
      autoQ.root,
      diag.root,
      note(
        'El coste es intrínseco: un rayo integrado por píxel. Al arrastrar se baja la ' +
          'resolución y el presupuesto de pasos; al soltar se acumulan muestras jittereadas ' +
          'hasta el objetivo.',
      ),
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  /** Refleja el estado actual en los controles (tras un preset o la camara). */
  private sync(): void {
    this.syncing = true
    const p = this.p
    this.sliders.get('massSolar')?.set(p.massSolar)
    this.sliders.get('spin')?.set(p.spin)
    this.sliders.get('charge')?.set(p.charge)
    this.sliders.get('inclination')?.set(p.inclination * DEG)
    this.sliders.get('distanceMeters')?.set(p.distanceMeters)
    this.sliders.get('fov')?.set(p.fov * DEG)
    this.sliders.get('diskOuter')?.set(p.diskOuter)
    this.sliders.get('eddingtonRatio')?.set(p.eddingtonRatio)
    this.sliders.get('diskOpacity')?.set(p.diskOpacity)
    this.sliders.get('timeWarp')?.set(p.timeWarp)
    this.sliders.get('starIntensity')?.set(p.starIntensity)
    this.sliders.get('starDensity')?.set(p.starDensity)
    this.sliders.get('milkyWayIntensity')?.set(p.milkyWayIntensity)
    this.sliders.get('dragGridRadius')?.set(p.dragGridRadius)
    this.sliders.get('layerOpacity')?.set(p.layerOpacity)
    this.sliders.get('renderScale')?.set(p.renderScale)
    this.sliders.get('interactiveScale')?.set(p.interactiveScale)
    this.sliders.get('maxIter')?.set(p.maxIter)
    this.sliders.get('tolerance')?.set(p.tolerance)
    this.sliders.get('targetSamples')?.set(p.targetSamples)
    this.sliders.get('exposure')?.set(p.exposure)
    this.sliders.get('bloomStrength')?.set(p.bloomStrength)
    this.sliders.get('orbitLaunchRadius')?.set(p.orbitLaunchRadius)
    this.sliders.get('orbitInclination')?.set(p.orbitInclination * DEG)
    this.sliders.get('orbitSpeedFraction')?.set(p.orbitSpeedFraction)
    this.sliders.get('orbitCharge')?.set(p.orbitCharge)
    this.sliders.get('orbitRevolutions')?.set(p.orbitRevolutions)
    this.sliders.get('orbitOpacity')?.set(p.orbitOpacity)
    this.distSlider.set(p.distanceRg)

    for (const [k, t] of this.toggles) {
      t.set(p[k as keyof SimParams] as boolean)
    }
    this.distMode?.set(p.distanceMode)
    this.diskDir?.set(p.diskPrograde ? 'pro' : 'retro')
    this.orbitDir?.set(p.orbitPrograde ? 'pro' : 'retro')

    // Mostrar solo el control de distancia del modo activo.
    for (const node of this.root.querySelectorAll<HTMLElement>('[data-mode]')) {
      node.style.display = node.dataset.mode === p.distanceMode ? '' : 'none'
    }
    this.syncing = false
  }
}

export { PARSEC }
