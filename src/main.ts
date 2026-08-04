/**
 * Punto de entrada: conecta el estado, la camara, el renderer y la UI.
 */

import {
  circularOmega,
  frameDraggingOmega,
  metric,
  zamoLapse,
} from './physics/kerrNewman'
import {
  nodalPrecession,
  particleFromLocalVelocity,
  periastronPrecession,
  traceOrbit,
} from './physics/orbits'
import { blackbodySample } from './physics/blackbody'
import {
  BODY_CATALOG,
  bodyRadiusRg,
  massRatio,
  tidalVerdict,
  TEST_PARTICLE_LIMIT,
} from './physics/bodies'
import { findFirstCrossing, pathDuration } from './physics/orbits'
import { orbitalFrequencyHz } from './physics/waves'
import { minSafeDistance, OrbitCamera } from './render/OrbitCamera'
import { traceToPoints } from './render/OrbitOverlay'
import { Renderer, type RenderStats } from './render/Renderer'
import { DEFAULT_PARAMS, ParamStore, type SimParams } from './state/params'
import { ChirpAudio } from './ui/ChirpAudio'
import { ControlPanel } from './ui/ControlPanel'
import { Hud } from './ui/Hud'
import { PRESETS, type Preset } from './ui/Presets'
import { Warnings } from './ui/Warnings'
import { el } from './ui/widgets'

const canvas = document.getElementById('view') as HTMLCanvasElement
const noticeEl = document.getElementById('notice') as HTMLElement
const panelEl = document.getElementById('panel') as HTMLElement
const panelBody = document.getElementById('panel-body') as HTMLElement
const panelToggle = document.getElementById('panel-toggle') as HTMLButtonElement
const hudEl = document.getElementById('hud') as HTMLElement
const hudBody = document.getElementById('hud-body') as HTMLElement
const warningsEl = document.getElementById('warnings') as HTMLElement
const statsEl = document.getElementById('stats') as HTMLElement

/** Muestra un error a pantalla completa en vez de dejar un canvas negro. */
function fatal(title: string, message: string, detail?: string): void {
  noticeEl.hidden = false
  const inner = el('div', 'notice-inner')
  inner.appendChild(el('h2', undefined, title))
  const p = el('p')
  p.innerHTML = message
  inner.appendChild(p)
  if (detail) inner.appendChild(el('pre', undefined, detail))
  noticeEl.replaceChildren(inner)
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

let renderer: Renderer
const store = new ParamStore(DEFAULT_PARAMS)

// `?capture=1` conserva el buffer de dibujo para que las herramientas de captura
// puedan leer el canvas fuera de un callback de rAF. No se usa en produccion.
const captureMode = new URLSearchParams(location.search).get('capture') === '1'

try {
  renderer = new Renderer(canvas, captureMode)
} catch (err) {
  fatal(
    'No se pudo inicializar WebGL2',
    'Este simulador integra geodésicas en la GPU y necesita <code>WebGL2</code>. ' +
      'Prueba con una versión reciente de Chrome, Edge, Firefox o Safari 15+, y comprueba ' +
      'que la aceleración por hardware esté activada.',
    err instanceof Error ? err.message : String(err),
  )
  throw err
}

const warnings = new Warnings(warningsEl, store)

// --- Un canvas en negro nunca debe quedarse callado ------------------------

renderer.onContextChange = (lost) => {
  if (lost) {
    fatal(
      'Se perdió el contexto WebGL',
      'La GPU reinició el driver mientras se trazaba la imagen. En Windows esto lo provoca el ' +
        '<code>watchdog TDR</code> cuando un solo dibujado tarda más de unos dos segundos, y es ' +
        'la causa habitual de una pantalla en negro sin ningún error. <b>Recarga la página</b>; ' +
        'al arrancar se reduce la calidad automáticamente. Si vuelve a pasar, baja ' +
        '«Resolución (reposo)» e «Iteraciones por rayo» en el panel de Render.',
      `GPU: ${renderer.caps.renderer}`,
    )
  } else {
    noticeEl.hidden = true
  }
}

renderer.onAutoDowngrade = (scale, frameMs) => {
  warnings.flash(
    'autoquality',
    'warn',
    `<b>Calidad reducida automáticamente</b> — un pase tardaba ${frameMs.toFixed(0)} ms, así que ` +
      `la resolución interna se bajó al ${(scale * 100).toFixed(0)} % de la elegida. Esto evita ` +
      'que el driver reinicie la GPU. Puedes desactivarlo en Render → «Calidad adaptativa».',
    14000,
    '⚠',
  )
}

/**
 * Vigilante de arranque: si pasados unos segundos no se ha completado ni un solo
 * pase de trazado, algo va mal y hay que decirlo en pantalla en vez de dejar el
 * canvas negro sin explicación.
 *
 * Se exige que el documento esté visible: en una pestaña en segundo plano el
 * navegador no ejecuta requestAnimationFrame, así que no haber renderizado es lo
 * normal y avisar sería una falsa alarma. Un mensaje de error incorrecto es peor
 * que ninguno, así que en ese caso se reintenta al volver a primer plano.
 */
function startupWatchdog(): void {
  if (renderer.hasRendered || renderer.isContextLost) return
  if (document.visibilityState !== 'visible') {
    document.addEventListener('visibilitychange', function again() {
      if (document.visibilityState !== 'visible') return
      document.removeEventListener('visibilitychange', again)
      window.setTimeout(startupWatchdog, 10000)
    })
    return
  }
  fatal(
    'No se ha podido dibujar ningún frame',
    'El trazador se inicializó (los shaders compilaron correctamente) pero no ha completado ' +
      'ningún pase. Suele deberse a una GPU sin aceleración por hardware o a un contexto ' +
      'bloqueado. Prueba a recargar; si persiste, comprueba que la aceleración por hardware ' +
      'esté activada en el navegador.',
    `GPU: ${renderer.caps.renderer}\nEXT_color_buffer_float: ${renderer.caps.colorBufferFloat}`,
  )
}

window.setTimeout(startupWatchdog, 10000)

if (renderer.degraded) {
  warnings.flash(
    'degraded',
    'warn',
    '<b>Sin objetivos de coma flotante</b> — falta <code>EXT_color_buffer_float</code>. Se ' +
      'renderiza en 8 bits por canal y sin acumulación progresiva: la imagen tendrá más ruido ' +
      'y menos rango dinámico. La física del trazado no cambia.',
    20000,
    '⚠',
  )
}

// ---------------------------------------------------------------------------
// Camara orbital <-> estado
// ---------------------------------------------------------------------------

let reconciling = false

const camera = new OrbitCamera(
  canvas,
  {
    inclination: DEFAULT_PARAMS.inclination,
    azimuth: DEFAULT_PARAMS.azimuth,
    distance: DEFAULT_PARAMS.distanceRg,
  },
  {
    minDistance: minSafeDistance(DEFAULT_PARAMS.spin, DEFAULT_PARAMS.charge),
    onChange: (s) => {
      if (reconciling) return
      reconciling = true
      // En modo distancia fisica, el zoom actua sobre la distancia en metros
      // para que la lectura del HUD siga siendo coherente.
      const p = store.get()
      if (p.distanceMode === 'physical') {
        const d = store.getDerived()
        store.patch({
          inclination: s.inclination,
          azimuth: s.azimuth,
          distanceMeters: s.distance * d.rgMeters,
        })
      } else {
        store.patch({
          inclination: s.inclination,
          azimuth: s.azimuth,
          distanceRg: s.distance,
        })
      }
      reconciling = false
    },
  },
)

/** Sincroniza la camara cuando el estado cambia desde el panel o un preset. */
store.subscribe((p, d) => {
  renderer.updateCalibration(p, d)
  camera.setDistanceLimits(minSafeDistance(p.spin, p.charge), 4000)
  if (reconciling) return
  const c = camera.get()
  const eps = 1e-9
  const targetDist = d.camDistanceRg
  if (
    Math.abs(c.inclination - p.inclination) > eps ||
    Math.abs(c.azimuth - p.azimuth) > eps ||
    Math.abs(c.distance - targetDist) > eps
  ) {
    reconciling = true
    camera.set({ inclination: p.inclination, azimuth: p.azimuth, distance: targetDist })
    reconciling = false
  }
})

// Cualquier cambio de estado invalida la imagen acumulada.
store.subscribe(() => renderer.invalidate())

/**
 * Reencuadra la cámara al cambiar de modo desde la interfaz.
 *
 * Cada modo necesita una cámara distinta, y la del modo anterior suele ser mala:
 * en la binaria, una inclinación de 90° con azimut 0 coloca la cámara justo sobre
 * la línea que une los dos agujeros, con uno detrás del otro; y la malla se lee
 * desde arriba, no de canto.
 *
 * Se hace en el callback del botón y NO como suscriptor del store, a propósito: un
 * suscriptor pisaría la cámara de cualquier patch programático que fije modo y
 * distancia a la vez (presets, herramientas de verificación), y eso ya causó una
 * medición con la cámara 16 veces más lejos de lo pedido. Reencuadrar es una
 * decisión de interacción, no un invariante de estado.
 */
function switchMode(mode: SimParams['mode']): void {
  const p = store.get()
  if (mode === p.mode) return

  const framing: Partial<SimParams> =
    mode === 'binary'
      ? {
          distanceMode: 'rg',
          distanceRg: Math.max(2.4 * p.binarySeparation, 60),
          // Casi desde el eje orbital: así los dos agujeros se ven lado a lado.
          inclination: (22 * Math.PI) / 180,
          fov: (45 * Math.PI) / 180,
        }
      : mode === 'mesh'
        ? {
            distanceMode: 'rg',
            distanceRg: 45,
            inclination: (65 * Math.PI) / 180,
            fov: (45 * Math.PI) / 180,
          }
        : {
            distanceMode: 'rg',
            distanceRg: DEFAULT_PARAMS.distanceRg,
            inclination: DEFAULT_PARAMS.inclination,
            fov: DEFAULT_PARAMS.fov,
          }

  store.patch({ mode, ...framing })
  if (mode === 'binary') renderer.resetOrbit(store.get(), store.getDerived())
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

function applyPreset(preset: Preset): void {
  store.patch(preset.params as Partial<SimParams>)
  if (preset.info) warnings.flash(`preset-${preset.id}`, 'info', `<b>${preset.name}</b> — ${preset.info}`, 14000, '★')
}

/** Paleta de colores para distinguir órbitas sucesivas. */
const ORBIT_COLORS: Array<[number, number, number]> = [
  [0.45, 1.0, 0.62],
  [1.0, 0.78, 0.32],
  [0.55, 0.72, 1.0],
  [1.0, 0.48, 0.72],
  [0.72, 1.0, 0.95],
  [0.9, 0.6, 1.0],
]

/**
 * Lanza una partícula de prueba con los parámetros del panel y añade su
 * trayectoria al overlay.
 */
function launchOrbit(): void {
  const p = store.get()
  const d = store.getDerived()
  const bh = d.bh

  const r0 = p.orbitLaunchRadius
  const theta0 = Math.PI / 2 - p.orbitInclination

  // Velocidad local de la órbita circular a ese radio, como referencia.
  const vRef = circularLocalSpeed(r0, theta0, bh, p.orbitPrograde)
  if (!Number.isFinite(vRef)) {
    warnings.flash(
      'orbit-fail',
      'warn',
      `<b>No hay órbita circular en r = ${r0.toFixed(1)} M</b> — está por dentro de la órbita ` +
        'de fotones. Prueba un radio mayor.',
      8000,
      '⚠',
    )
    return
  }

  const v = Math.min(0.9995, vRef * p.orbitSpeedFraction)
  const dir = p.orbitPrograde ? 1 : -1

  try {
    const { y, k } = particleFromLocalVelocity(r0, theta0, [0, 0, dir * v], bh, p.orbitCharge)
    // Periodo orbital aproximado en tiempo propio, para fijar cuánto integrar.
    const period = 2 * Math.PI * Math.pow(r0, 1.5)
    const res = traceOrbit(y, k, bh, {
      tauMax: p.orbitRevolutions * period,
      maxSteps: 120_000,
    })

    const color = ORBIT_COLORS[renderer.overlay.list.length % ORBIT_COLORS.length]

    // --- Cuerpo animado sobre la trayectoria -------------------------------
    const spec = BODY_CATALOG[p.bodyKind] ?? BODY_CATALOG.sun
    const tidal = tidalVerdict(spec, p.massSolar, d.rPlus, res.rMin)
    // Color: los planetas no radian, así que se les da su albedo; las estrellas
    // toman su color de cuerpo negro real desde la misma LUT que el disco.
    const bodyColor: [number, number, number] =
      spec.albedo ??
      (() => {
        const s = blackbodySample(spec.temperatureK)
        const m = Math.max(s.chroma[0], s.chroma[1], s.chroma[2], 1e-6)
        return [s.chroma[0] / m, s.chroma[1] / m, s.chroma[2] / m]
      })()

    renderer.overlay.add({
      label: `${spec.label} · r₀=${r0.toFixed(1)}M`,
      color,
      points: traceToPoints(res),
      info: {
        outcome: res.outcome,
        rMin: res.rMin,
        rMax: res.rMax,
        charged: p.orbitCharge !== 0,
        eps: p.orbitCharge,
        orbits: Math.abs(res.phiTotal) / (2 * Math.PI),
      },
      body: {
        result: res,
        radiusRg: bodyRadiusRg(spec, p.massSolar),
        tidalRg: tidal.swallowedWhole ? NaN : tidal.rTidal,
        bodyColor,
        time: 0,
        durationProper: pathDuration(res, 'proper'),
        durationCoordinate: pathDuration(res, 'coordinate'),
      },
    })

    // --- Avisos de marea y de validez del modelo ---------------------------
    if (massRatio(spec, p.massSolar) > TEST_PARTICLE_LIMIT) {
      warnings.flash(
        'testparticle',
        'warn',
        `<b>Fuera del régimen de partícula de prueba</b> — ${spec.label} tiene una masa de ` +
          `${(massRatio(spec, p.massSolar) * 100).toPrecision(3)} % la del agujero negro. Por ` +
          'encima del 0.1 % el cuerpo perturba la métrica y tratarlo como geodésica del fondo ' +
          'fijo deja de ser defendible. Sube la masa del agujero para volver al régimen válido.',
        16000,
        '⚠',
      )
    }
    if (tidal.swallowedWhole) {
      warnings.flash(
        'tidal',
        'info',
        `<b>${spec.label} caería entera</b> — su radio de marea (${tidal.rTidal.toPrecision(3)} M) ` +
          `queda DENTRO del horizonte (${d.rPlus.toFixed(2)} M). Es lo que pasa en los agujeros ` +
          'supermasivos: <code>r_t/r_g ∝ M⁻²ᐟ³</code>, así que cuanto más masivo el agujero, más ' +
          'adentro queda el radio de marea. Por eso no se ven eventos de disrupción en los más grandes.',
        16000,
        'ℹ',
      )
    } else if (tidal.disrupts) {
      const cross = findFirstCrossing(res, tidal.rTidal, p.bodyClock)
      warnings.flash(
        'tidal',
        'warn',
        `<b>${spec.label} se desgarra por marea</b> — cruza su radio de marea de ` +
          `${tidal.rTidal.toPrecision(3)} M` +
          (cross ? ` tras ${cross.time.toPrecision(3)} M de tiempo ${p.bodyClock === 'proper' ? 'propio' : 'coordenado'}` : '') +
          '. El marcador se pone rojo a partir de ahí. La app no simula los restos: modelar la ' +
          'disrupción exige hidrodinámica, no una geodésica.',
        16000,
        '⚠',
      )
    }

    const outcomeText = {
      captured: 'cae al agujero',
      escaped: 'escapa al infinito',
      complete: 'órbita acotada',
      maxSteps: 'integración truncada',
      stopped: 'detenida',
    }[res.outcome]

    const prec = periastronPrecession(res)
    const nodal = nodalPrecession(res)
    const bits = [
      `<b>Partícula lanzada</b> — ${outcomeText}`,
      `r ∈ [${res.rMin.toFixed(2)}, ${res.rMax.toFixed(2)}] M`,
      `${(Math.abs(res.phiTotal) / (2 * Math.PI)).toFixed(1)} vueltas`,
    ]
    if (prec !== null) bits.push(`precesión del periastro ${((prec * 180) / Math.PI).toFixed(2)}°/órbita`)
    if (nodal !== null && Math.abs(nodal) > 1e-4) {
      bits.push(`precesión nodal (Lense-Thirring) ${((nodal * 180) / Math.PI).toFixed(3)}°/órbita`)
    }
    if (p.orbitCharge !== 0 && p.charge > 0) {
      bits.push('con fuerza de Lorentz activa')
    }
    warnings.flash('orbit', 'info', bits.join(' · '), 12000, '◠')
  } catch (err) {
    warnings.flash(
      'orbit-fail',
      'warn',
      `<b>No se pudo trazar la órbita</b> — ${err instanceof Error ? err.message : String(err)}`,
      8000,
      '⚠',
    )
  }
}

/**
 * Velocidad local (fracción de c, en el marco ZAMO) de la órbita circular en r.
 * Se obtiene de Omega y de la geometría local, sin volver a resolver la órbita.
 */
function circularLocalSpeed(
  r: number,
  theta: number,
  bh: { a: number; q: number },
  prograde: boolean,
): number {
  const Om = circularOmega(r, bh, prograde)
  if (!Number.isFinite(Om)) return NaN
  const omega = frameDraggingOmega(r, theta, bh)
  const alpha = zamoLapse(r, theta, bh)
  if (alpha <= 0) return NaN
  const g = metric(r, theta, bh)
  // v = (Omega - omega) sqrt(g_phiphi) / alpha, la velocidad medida por el ZAMO.
  const v = Math.abs(((Om - omega) * Math.sqrt(Math.max(g.g_phiphi, 0))) / alpha)
  return v < 1 ? v : NaN
}

// --- Chirp audible ---------------------------------------------------------

const chirp = new ChirpAudio()

store.subscribe((p) => {
  // El audio solo puede arrancar desde un gesto del usuario; el toggle del panel
  // lo es, así que basta reaccionar al cambio de parámetro.
  if (p.chirpAudio && p.mode === 'binary' && !chirp.isRunning) {
    chirp.start().catch((e) => {
      warnings.flash(
        'audio',
        'warn',
        `<b>No se pudo iniciar el audio</b> — ${e instanceof Error ? e.message : String(e)}`,
        6000,
        '⚠',
      )
      store.patch({ chirpAudio: false })
    })
  } else if ((!p.chirpAudio || p.mode !== 'binary') && chirp.isRunning) {
    chirp.stop()
  }
})

new ControlPanel(panelBody, {
  store,
  onPreset: applyPreset,
  onModeChange: switchMode,
  onLaunchOrbit: launchOrbit,
  onResetOrbit: () => {
    renderer.resetOrbit(store.get(), store.getDerived())
    renderer.invalidate()
    warnings.flash('orbit-reset', 'info', '<b>Órbita reiniciada</b>', 3000, '↺')
  },
  onGW150914: () => {
    // Masas del sistema en el marco fuente: 36 + 29 M_sol, a 410 Mpc.
    store.patch({
      mode: 'binary',
      massSolar: 65,
      binaryMassRatio: 36 / 65,
      binarySeparation: 60,
      binaryEccentricity: 0,
      binaryEvolving: true,
      distanceMode: 'rg',
      distanceRg: 70,
      inclination: (70 * Math.PI) / 180,
    })
    renderer.resetOrbit(store.get(), store.getDerived())
    const d = store.getDerived()
    warnings.flash(
      'gw150914',
      'info',
      '<b>GW150914</b> — la primera detección directa de ondas gravitacionales (2015): ' +
        `36 + 29 M☉ a 410 Mpc. Masa de chirp ${d.chirpMassSolar.toFixed(1)} M☉. El modelo de ` +
        'inspiral corta en ' +
        `${d.cutoffFrequencyHz.toFixed(0)} Hz; el pico observado fue de ~250 Hz, que ya es la ` +
        'fusión propiamente dicha y requiere relatividad numérica.',
      18000,
      '★',
    )
  },
  onClearOrbits: () => {
    renderer.overlay.clear()
    warnings.flash('orbit', 'info', '<b>Órbitas borradas</b>', 3000, '◠')
  },
  onRewindBodies: () => renderer.overlay.rewind(),
  onResetView: () => {
    store.patch({
      inclination: DEFAULT_PARAMS.inclination,
      azimuth: DEFAULT_PARAMS.azimuth,
      distanceRg: DEFAULT_PARAMS.distanceRg,
      fov: DEFAULT_PARAMS.fov,
      distanceMode: 'rg',
    })
  },
  onScreenshot: () => {
    // Solo tiene sentido capturar una imagen ya convergida.
    const url = renderer.screenshot()
    const a = document.createElement('a')
    const p = store.get()
    a.href = url
    a.download = `kerr-newman_a${p.spin.toFixed(3)}_q${p.charge.toFixed(3)}.png`
    a.click()
    warnings.flash('shot', 'info', '<b>Captura guardada</b> — PNG del canvas en su estado actual.', 4000, '⬇')
  },
  onToggleHud: () => hudEl.classList.toggle('hidden'),
})

new Hud(hudBody, store)

panelToggle.addEventListener('click', () => {
  const collapsed = panelEl.classList.toggle('collapsed')
  panelToggle.textContent = collapsed ? '›' : '‹'
  panelToggle.title = collapsed ? 'Mostrar panel (H)' : 'Ocultar panel (H)'
})

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return
  if (e.key === 'h' || e.key === 'H') panelToggle.click()
  if (e.key === 'j' || e.key === 'J') hudEl.classList.toggle('hidden')
  if (e.key === ' ') {
    e.preventDefault()
    store.patch({ timeWarp: store.get().timeWarp === 0 ? 1 : 0 })
  }
})

// ---------------------------------------------------------------------------
// Bucle de render
// ---------------------------------------------------------------------------

const statsSpans = {
  res: el('span'),
  spp: el('span'),
  ms: el('span'),
  gpu: el('span'),
}
// La GPU se muestra en la barra de estado: si algo va mal, es el primer dato que
// hace falta para diagnosticar.
statsSpans.gpu.textContent = shortRenderer(renderer.caps.renderer)
statsSpans.gpu.title = `${renderer.caps.renderer}\nEXT_color_buffer_float: ${renderer.caps.colorBufferFloat}`
statsEl.append(statsSpans.res, statsSpans.spp, statsSpans.ms, statsSpans.gpu)

/** Acorta la cadena del renderer, que suele ser larguísima. */
function shortRenderer(s: string): string {
  const m = s.match(/ANGLE \(([^,]+), ([^,)]+)/)
  if (m) return m[2].replace(/ Direct3D.*| \(0x[0-9A-Fa-f]+\)| vs_\d+_\d+.*/g, '').trim()
  return s.slice(0, 42)
}

function renderStatsLine(s: RenderStats | null, animatingBodies = false): void {
  if (!s) return
  statsSpans.res.innerHTML = `<span class="s-val">${s.internalWidth}×${s.internalHeight}</span> @ ${(s.scale * 100).toFixed(0)}%`
  statsSpans.spp.innerHTML = animatingBodies
    ? `<span class="s-val">${s.samples} spp</span> · cuerpo en movimiento`
    : s.converged
      ? `<span class="conv">${s.samples} spp · convergido</span>`
      : `<span class="s-val">${s.samples}/${s.targetSamples}</span> spp`
  statsSpans.ms.innerHTML = `<span class="s-val">${s.frameMs.toFixed(1)}</span> ms`
}

let lastTime = performance.now()
let lastRealtime = false
let lastStats: RenderStats | null = null

/**
 * Gancho de instrumentacion para `tools/smoke.mjs`: permite a la prueba de humo
 * leer el estado del render y aplicar presets sin depender del DOM del panel.
 */
;(window as unknown as Record<string, unknown>).__sim = {
  store,
  renderer,
  camera,
  presets: PRESETS,
  applyPreset,
  launchOrbit,
  get lastStats() {
    return lastStats
  },
}

function frame(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now

  camera.update()

  const p = store.get()
  const d = store.getDerived()

  // El disco en rotacion cambia la escena cada frame, asi que invalida la
  // acumulacion igual que mover la camara. Por eso "animando" y "arrastrando"
  // son el mismo modo de render: resolucion reducida y una sola muestra.
  // Acumular exige escena quieta; con el disco pausado (barra espaciadora) la
  // imagen converge a calidad plena.
  const animating = renderer.advanceTime(dt, p, d)
  if (animating) renderer.invalidate()

  // El chirp se alimenta de la frecuencia orbital VIVA de la binaria, que es la
  // que va cambiando con el inspiral.
  if (p.mode === 'binary' && chirp.isRunning) {
    const o = renderer.binaryOrbit
    chirp.update(2 * orbitalFrequencyHz(o.a, p.massSolar))
  }

  // Los cuerpos animados avanzan en el reloj elegido. Mover un cuerpo cambia la
  // imagen, así que cuenta como animación igual que rotar el disco.
  let bodiesMoving = false
  if (p.mode === 'single' && p.showOrbits && p.bodyPlaying) {
    bodiesMoving = renderer.overlay.advance(dt * p.bodySpeed, p.bodyClock, p.bodyLoop)
  }

  // El overlay se dibuja después del tonemap, así que mover un cuerpo no obliga a
  // volver a trazar la imagen: basta con no dejar que se considere convergida.
  const realtime = camera.isInteracting || animating

  // Al pasar de tiempo real a reposo hay que rehacer la imagen a resolucion plena.
  if (realtime !== lastRealtime) {
    renderer.invalidate()
    lastRealtime = realtime
  }

  const stats = renderer.render(p, d, realtime)
  if (stats) lastStats = stats
  renderStatsLine(stats, bodiesMoving)
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)

// Un cambio de tamano de ventana invalida el acumulador (lo detecta el resize
// interno del renderer, pero forzarlo evita un frame de imagen estirada).
window.addEventListener('resize', () => renderer.invalidate())
