/**
 * Panel de control. Cada control escribe en el ParamStore; la reconciliacion
 * con la camara orbital la hace main.ts.
 */

import { formatLength, formatMass, PARSEC } from '../physics/units'
import {
  SPIN_LIMIT,
  type DistanceMode,
  type ParamStore,
  type SimParams,
  type ViewMode,
} from '../state/params'
import { BODY_CATALOG } from '../physics/bodies'
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
  /** Reinicia el reloj de todos los cuerpos animados. */
  onRewindBodies: () => void
  /** Cambia de modo. Quien lo implementa reencuadra tambien la camara. */
  onModeChange: (m: ViewMode) => void
  /** Reinicia la orbita de la binaria a los parametros actuales. */
  onResetOrbit: () => void
  /** Carga las masas y la distancia de GW150914. */
  onGW150914: () => void
}

export class ControlPanel {
  private sliders = new Map<string, SliderHandle>()
  private toggles = new Map<string, ToggleHandle>()
  private distMode!: SegmentedHandle<DistanceMode>
  private diskDir!: SegmentedHandle<'pro' | 'retro'>
  private orbitDir!: SegmentedHandle<'pro' | 'retro'>
  private modeSeg!: SegmentedHandle<ViewMode>
  private bodyClockSeg!: SegmentedHandle<'proper' | 'coordinate'>
  private bodyKindSel!: HTMLSelectElement
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
      this.buildMode(),
      this.buildPresets(),
      this.buildBinary(),
      this.buildBlackHole(),
      this.buildCamera(),
      this.buildDisk(),
      this.buildBackground(),
      this.buildLayers(),
      this.buildMesh(),
      this.buildOrbits(),
      this.buildRender(),
    )
  }

  // -------------------------------------------------------------------------

  private buildMesh(): HTMLElement {
    const s = section('Malla del espaciotiempo', true)
    s.root.dataset.onlyMode = 'mesh'

    const surf = toggle('Superficie del embedding', this.p.meshShowSurface, (v) =>
      this.patch({ meshShowSurface: v }),
    )
    this.toggles.set('meshShowSurface', surf)

    const lapseT = toggle('Colorear por dilatación temporal', this.p.meshShowLapse, (v) =>
      this.patch({ meshShowLapse: v }),
    )
    lapseT.root.title =
      'El color es el lapso α = dτ/dt. Es la parte que la cama elástica omite, y la que ' +
      'de verdad explica por qué cae un objeto lento.'
    this.toggles.set('meshShowLapse', lapseT)

    const horizonT = toggle('Superficie del horizonte', this.p.meshShowHorizon, (v) =>
      this.patch({ meshShowHorizon: v }),
    )
    horizonT.root.title =
      'Con a/M > √3/2 ≈ 0.866 el horizonte no cabe en espacio euclídeo (Smarr 1973) y se ' +
      'marca en rojo.'
    this.toggles.set('meshShowHorizon', horizonT)

    const outer = slider({
      label: 'Radio exterior',
      symbol: 'r',
      min: 5,
      max: 60,
      step: 0.5,
      value: this.p.meshOuterRadius,
      format: (v) => `${v.toFixed(1)} M`,
      onInput: (v) => this.patch({ meshOuterRadius: v }),
    })
    this.sliders.set('meshOuterRadius', outer)

    const height = slider({
      label: 'Exageración vertical',
      min: 0.2,
      max: 3,
      step: 0.05,
      value: this.p.meshHeightScale,
      format: (v) => (Math.abs(v - 1) < 0.03 ? '1.00× (isométrico)' : `${v.toFixed(2)}×`),
      onInput: (v) => this.patch({ meshHeightScale: v }),
    })
    this.sliders.set('meshHeightScale', height)

    const density = slider({
      label: 'Densidad de la rejilla',
      min: 0.3,
      max: 2.5,
      step: 0.05,
      value: this.p.meshGridDensity,
      format: (v) => `${v.toFixed(2)}×`,
      onInput: (v) => this.patch({ meshGridDensity: v }),
    })
    this.sliders.set('meshGridDensity', density)

    s.body.append(
      note(
        'La superficie es el <b>embedding isométrico exacto</b> de la rebanada ecuatorial: ' +
          '<code>z(r) = √(8M(r−2M))</code> para Schwarzschild, que reproduce la métrica ' +
          'inducida <code>dr²/(1−2M/r)</code> sin aproximar. Las distancias medidas sobre ella ' +
          'son distancias propias reales.',
      ),
      surf.root,
      lapseT.root,
      horizonT.root,
      outer.root,
      height.root,
      density.root,
      note(
        '<b>Cuidado con la cama elástica.</b> Esto es <em>una rebanada espacial</em>, no el ' +
          'espaciotiempo; la altura es una dimensión auxiliar que no existe físicamente, y nada ' +
          'cae "hacia abajo" por ella. Y sobre todo: la curvatura del espacio <b>no</b> es lo ' +
          'que hace caer a los objetos — para velocidades bajas casi toda la gravedad newtoniana ' +
          'sale de la curvatura del <b>tiempo</b>. Por eso el color importa más que la forma: es ' +
          'el gradiente del lapso el que produce la caída.',
      ),
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildOrbits(): HTMLElement {
    const s = section('Órbitas de prueba', false)
    s.root.dataset.onlyMode = 'single'

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

    // --- Cuerpo que se coloca ---------------------------------------------
    const kindRow = el('div', 'ctl')
    const kindLabel = el('div', 'ctl-label')
    kindLabel.append(el('span', 'name', 'Cuerpo'))
    const kindSel = el('select')
    kindSel.className = 'select'
    for (const [key, spec] of Object.entries(BODY_CATALOG)) {
      const o = document.createElement('option')
      o.value = key
      o.textContent = spec.label
      if (key === this.p.bodyKind) o.selected = true
      kindSel.appendChild(o)
    }
    kindSel.addEventListener('change', () => this.patch({ bodyKind: kindSel.value }))
    this.bodyKindSel = kindSel
    kindRow.append(kindLabel, kindSel)

    const clock = segmented<'proper' | 'coordinate'>(
      [
        { value: 'proper', label: 'reloj del cuerpo', title: 'Tiempo propio: cruza el horizonte en tiempo finito' },
        { value: 'coordinate', label: 'reloj lejano', title: 'Tiempo coordenado: parece frenarse y no cruzar nunca' },
      ],
      this.p.bodyClock,
      (v) => this.patch({ bodyClock: v }),
    )
    this.bodyClockSeg = clock

    const playing = toggle('Animación en marcha', this.p.bodyPlaying, (v) =>
      this.patch({ bodyPlaying: v }),
    )
    this.toggles.set('bodyPlaying', playing)

    const loop = toggle('Repetir al terminar', this.p.bodyLoop, (v) => this.patch({ bodyLoop: v }))
    this.toggles.set('bodyLoop', loop)

    const bodySpeed = slider({
      label: 'Velocidad de la animación',
      min: 1,
      max: 2000,
      value: this.p.bodySpeed,
      log: true,
      format: (v) => `${v.toPrecision(3)} M/s`,
      onInput: (v) => this.patch({ bodySpeed: v }),
    })
    this.sliders.set('bodySpeed', bodySpeed)

    const actions = el('div', 'btn-row')
    actions.append(
      button('Colocar cuerpo', () => this.opts.onLaunchOrbit()),
      button('Reiniciar', () => this.opts.onRewindBodies()),
      button('Borrar todos', () => this.opts.onClearOrbits()),
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
      kindRow,
      radius.root,
      incl.root,
      speed.root,
      dir.root,
      charge.root,
      revs.root,
      note(
        'Un planeta o una estrella orbitando un agujero negro <b>es</b> una partícula de prueba: ' +
          'su masa es despreciable, así que sigue exactamente una geodésica temporal del fondo. ' +
          'Eso es relatividad general exacta, no una aproximación. La estrella <b>S2</b> alrededor ' +
          'de Sgr A* es la comprobación observacional: GRAVITY midió su precesión en 2020.',
      ),
      clock.root,
      note(
        'Los dos relojes divergen: en <b>tiempo propio</b> el cuerpo cruza el horizonte en un ' +
          'tiempo finito y corriente; en <b>tiempo coordenado</b> parece frenarse y no llegar ' +
          'nunca. Ninguno es «el correcto» — son dos preguntas distintas.',
      ),
      playing.root,
      loop.root,
      bodySpeed.root,
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

  private buildMode(): HTMLElement {
    const s = section('Modo', true)
    this.modeSeg = segmented<ViewMode>(
      [
        { value: 'single', label: 'Un agujero', title: 'Kerr-Newman: masa, carga y espín' },
        { value: 'binary', label: 'Dos agujeros', title: 'Brill-Lindquist + post-newtoniano' },
        { value: 'mesh', label: 'Malla', title: 'Geometría de la rebanada espacial' },
      ],
      this.p.mode,
      // El cambio de modo pasa por el callback, no por un patch directo: main.ts
      // reencuadra la camara al mismo tiempo (ver switchMode).
      (v) => this.opts.onModeChange(v),
    )
    s.body.append(this.modeSeg.root)
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildBinary(): HTMLElement {
    const s = section('Dos agujeros negros', true)
    s.root.dataset.onlyMode = 'binary'

    const ratio = slider({
      label: 'Reparto de masa',
      symbol: 'm₁/M',
      min: 0.05,
      max: 0.95,
      step: 0.005,
      value: this.p.binaryMassRatio,
      format: (v) => `${(v * 100).toFixed(1)} / ${((1 - v) * 100).toFixed(1)} %`,
      onInput: (v) => this.patch({ binaryMassRatio: v }),
    })
    this.sliders.set('binaryMassRatio', ratio)

    const sep = slider({
      label: 'Separación',
      symbol: 'a',
      min: 8,
      max: 200,
      step: 0.5,
      value: this.p.binarySeparation,
      format: (v) => `${v.toFixed(1)} M`,
      onInput: (v) => this.patch({ binarySeparation: v }),
    })
    this.sliders.set('binarySeparation', sep)

    const ecc = slider({
      label: 'Excentricidad',
      symbol: 'e',
      min: 0,
      max: 0.9,
      step: 0.005,
      value: this.p.binaryEccentricity,
      format: (v) => v.toFixed(3),
      onInput: (v) => this.patch({ binaryEccentricity: v }),
    })
    this.sliders.set('binaryEccentricity', ecc)

    const evolving = toggle('Inspiral activo', this.p.binaryEvolving, (v) =>
      this.patch({ binaryEvolving: v }),
    )
    evolving.root.title =
      'La órbita decae por emisión de ondas gravitacionales (ecuaciones de Peters). ' +
      'Mientras evoluciona, la imagen se renderiza en tiempo real y no acumula muestras.'
    this.toggles.set('binaryEvolving', evolving)

    const speed = slider({
      label: 'Velocidad del inspiral',
      min: 0.05,
      max: 20,
      value: this.p.binaryTimeScale,
      log: true,
      format: (v) => `${v.toFixed(2)}×`,
      onInput: (v) => this.patch({ binaryTimeScale: v }),
    })
    this.sliders.set('binaryTimeScale', speed)

    const grid = toggle('Rejilla en los horizontes', this.p.binaryShowGrid, (v) =>
      this.patch({ binaryShowGrid: v }),
    )
    grid.root.title = 'Colorea cada sombra según qué agujero capturó el rayo'
    this.toggles.set('binaryShowGrid', grid)

    const audio = toggle('Chirp audible', this.p.chirpAudio, (v) =>
      this.patch({ chirpAudio: v }),
    )
    audio.root.title =
      'Sonifica la frecuencia de la onda gravitacional. Para masas estelares cae ' +
      'directamente en el rango audible: es el chirp de LIGO.'
    this.toggles.set('chirpAudio', audio)

    const row = el('div', 'btn-row')
    row.append(
      button('Reiniciar órbita', () => this.opts.onResetOrbit()),
      button('GW150914', () => this.opts.onGW150914(), 'Masas y distancia de la primera detección'),
    )

    s.body.append(
      note(
        '<b>No existe solución exacta de Einstein para dos agujeros negros.</b> Lo que se traza ' +
          'aquí son <b>datos iniciales de Brill-Lindquist</b>, que sí son solución exacta de las ' +
          '<em>ligaduras</em>: <code>ψ = 1 + m₁/2r₁ + m₂/2r₂</code>, con la métrica ' +
          '<code>ψ⁴δᵢⱼ</code> y el horizonte en <code>ψ = 2</code>. Las órbitas las da la ' +
          'dinámica post-newtoniana, no Einstein: una secuencia de instantáneas no es una fusión ' +
          'simulada. Con <code>m₂ = 0</code> esto es Schwarzschild isótropo, y el trazador ' +
          'reproduce √27 M por esa vía.',
      ),
      ratio.root,
      sep.root,
      ecc.root,
      evolving.root,
      speed.root,
      grid.root,
      audio.root,
      row,
      note(
        'En este modo no hay disco: lo interesante es el <b>lente doble</b> sobre el fondo ' +
          'estelar, con dos sombras, imágenes múltiples y anillos de Einstein cruzados. Estos ' +
          'agujeros no giran ni tienen carga: la solución es conformemente plana, luego ' +
          '<code>K_ij = 0</code>.',
      ),
    )
    return s.root
  }

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
    // En modo binaria, el espin y la carga no aplican: Brill-Lindquist es
    // conformemente plana. La masa sigue valiendo como escala total.
    s.root.dataset.hideMode = 'binary'

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
    // La binaria no tiene disco: es conformemente plana y el interes esta en el
    // lente doble sobre el fondo.
    s.root.dataset.hideMode = 'binary mesh'

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

    // --- Galaxias de fondo -------------------------------------------------
    const gCount = slider({
      label: 'Galaxias de fondo',
      min: 0,
      max: 4,
      step: 1,
      value: this.p.galaxyCount,
      format: (v) => (v === 0 ? 'ninguna' : `${v.toFixed(0)}`),
      onInput: (v) => this.patch({ galaxyCount: Math.round(v) }),
    })
    this.sliders.set('galaxyCount', gCount)

    const gSize = slider({
      label: 'Tamaño angular',
      min: 0.01,
      max: 0.3,
      step: 0.005,
      value: this.p.galaxySize,
      format: (v) => `${((v * 180) / Math.PI).toFixed(1)}°`,
      onInput: (v) => this.patch({ galaxySize: v }),
    })
    this.sliders.set('galaxySize', gSize)

    const gBright = slider({
      label: 'Brillo de las galaxias',
      min: 0,
      max: 4,
      step: 0.05,
      value: this.p.galaxyBrightness,
      format: (v) => v.toFixed(2),
      onInput: (v) => this.patch({ galaxyBrightness: v }),
    })
    this.sliders.set('galaxyBrightness', gBright)

    const gSpiral = slider({
      label: 'Brazos espirales',
      min: 0,
      max: 2,
      step: 0.05,
      value: this.p.galaxySpiral,
      format: (v) => (v === 0 ? 'elípticas' : v.toFixed(2)),
      onInput: (v) => this.patch({ galaxySpiral: v }),
    })
    this.sliders.set('galaxySpiral', gSpiral)

    const gAlign = toggle('Alinear una detrás del agujero', this.p.galaxyAlignBehind, (v) =>
      this.patch({ galaxyAlignBehind: v }),
    )
    gAlign.root.title =
      'Coloca la primera galaxia justo detrás del agujero negro respecto a la cámara: es la ' +
      'configuración que produce un anillo de Einstein completo.'
    this.toggles.set('galaxyAlignBehind', gAlign)

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
      note(
        '<b>Las galaxias van de fondo, no en órbita.</b> Una galaxia tiene ~10¹¹ masas solares y ' +
          '~30 kpc de diámetro: es mucho más masiva y más grande que cualquier agujero negro, así ' +
          'que no lo orbita — el agujero está en <em>su</em> centro. Lo que sí es real es su ' +
          '<b>lente gravitacional</b>: arcos, imágenes múltiples y anillos de Einstein. Es lo que ' +
          'observan Hubble y JWST, y aquí lo produce el propio trazado, no un efecto dibujado.',
      ),
      gCount.root,
      gSize.root,
      gBright.root,
      gSpiral.root,
      gAlign.root,
    )
    return s.root
  }

  // -------------------------------------------------------------------------

  private buildLayers(): HTMLElement {
    const s = section('Capas geométricas', false)
    s.root.dataset.onlyMode = 'single'

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

    this.sliders.get('binaryMassRatio')?.set(p.binaryMassRatio)
    this.sliders.get('binarySeparation')?.set(p.binarySeparation)
    this.sliders.get('binaryEccentricity')?.set(p.binaryEccentricity)
    this.sliders.get('binaryTimeScale')?.set(p.binaryTimeScale)
    this.sliders.get('meshOuterRadius')?.set(p.meshOuterRadius)
    this.sliders.get('meshHeightScale')?.set(p.meshHeightScale)
    this.sliders.get('meshGridDensity')?.set(p.meshGridDensity)
    this.sliders.get('bodySpeed')?.set(p.bodySpeed)
    this.sliders.get('galaxyCount')?.set(p.galaxyCount)
    this.sliders.get('galaxySize')?.set(p.galaxySize)
    this.sliders.get('galaxyBrightness')?.set(p.galaxyBrightness)
    this.sliders.get('galaxySpiral')?.set(p.galaxySpiral)
    this.modeSeg?.set(p.mode)
    this.bodyClockSeg?.set(p.bodyClock)
    if (this.bodyKindSel) this.bodyKindSel.value = p.bodyKind

    // Mostrar solo el control de distancia del modo activo.
    for (const node of this.root.querySelectorAll<HTMLElement>('[data-mode]')) {
      node.style.display = node.dataset.mode === p.distanceMode ? '' : 'none'
    }
    // Secciones que solo aplican a ciertos modos de visualizacion.
    for (const node of this.root.querySelectorAll<HTMLElement>('[data-only-mode]')) {
      const modes = (node.dataset.onlyMode ?? '').split(/\s+/)
      node.style.display = modes.includes(p.mode) ? '' : 'none'
    }
    for (const node of this.root.querySelectorAll<HTMLElement>('[data-hide-mode]')) {
      const modes = (node.dataset.hideMode ?? '').split(/\s+/)
      node.style.display = modes.includes(p.mode) ? 'none' : ''
    }
    this.syncing = false
  }
}

export { PARSEC }
