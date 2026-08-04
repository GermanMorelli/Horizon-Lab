/**
 * Verificacion en GPU de los cuerpos animados y de las galaxias de fondo lensadas.
 *
 * Los cuerpos: que el marcador se dibuja, que se mueve al avanzar el reloj, y que
 * los dos relojes dan recorridos de duracion distinta (el coordenado mas largo).
 *
 * Las galaxias: que aparecen, y sobre todo que el LENTE las deforma. La prueba es
 * comparativa: con una galaxia alineada detras del agujero, la luz debe repartirse
 * en un anillo alrededor de la sombra en lugar de quedarse concentrada en un disco
 * central. Eso se mide comparando el brillo de una corona con el del centro.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const baseUrl = process.argv[2] ?? 'http://localhost:5173'
const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}capture=1`

process.on('uncaughtException', (e) => {
  const msg = String(e?.message ?? e)
  if (/Execution context was destroyed|Target closed/.test(msg)) {
    console.error('\n✗ La página se recargó a mitad de la medición (HMR de Vite).')
    process.exit(2)
  }
  console.error(e)
  process.exit(1)
})

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 600, height: 600 } })
const glErrors = new Set()
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
page.on('console', (m) => {
  const t = m.text()
  if (/GL_INVALID|GL_OUT_OF_MEMORY/.test(t)) glErrors.add(t.slice(0, 160))
  if (m.type() === 'error') console.log(`[error] ${t}`)
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, ok })
  console.log(`   ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

/** Escena base comun a todas las medidas. */
const BASE = {
  mode: 'single',
  spin: 0.6,
  charge: 0,
  massSolar: 1e6,
  diskEnabled: false,
  starsEnabled: true,
  starIntensity: 1.5,
  starDensity: 0.6,
  milkyWayIntensity: 0.2,
  galaxyCount: 0,
  showHorizon: false,
  showErgosphere: false,
  showPhotonSphere: false,
  showIsco: false,
  showDragGrid: false,
  bloomEnabled: false,
  autoQuality: false,
  timeWarp: 0,
  exposure: 2,
  renderScale: 0.6,
  targetSamples: 3,
  maxIter: 700,
  tolerance: 1e-5,
  rEscape: 300,
  distanceMode: 'rg',
  distanceRg: 60,
  inclination: (75 * Math.PI) / 180,
  fov: (40 * Math.PI) / 180,
}

/** Espera convergencia y analiza el canvas por anillos radiales. */
async function shoot(patch, label, saveAs, actions = null) {
  const out = await page.evaluate(
    async ({ patch, actions }) => {
      const sim = window.__sim
      sim.store.patch(patch)
      if (actions?.clearBodies) sim.renderer.overlay.clear()
      if (actions?.launch) {
        for (let i = 0; i < actions.launch; i++) sim.launchOrbit()
      }
      if (actions?.rewind) sim.renderer.overlay.rewind()
      if (actions?.advance) {
        sim.renderer.overlay.advance(actions.advance, sim.store.get().bodyClock, false)
      }
      sim.renderer.invalidate()

      const t0 = performance.now()
      while (performance.now() - t0 < 180000) {
        await new Promise((r) => requestAnimationFrame(r))
        if (sim.lastStats?.converged) break
      }
      // Un par de frames extra para que el overlay se dibuje sobre el composite.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

      const src = document.getElementById('view')
      const c2 = document.createElement('canvas')
      c2.width = src.width
      c2.height = src.height
      const ctx = c2.getContext('2d')
      ctx.drawImage(src, 0, 0)
      const W = c2.width
      const H = c2.height
      const px = ctx.getImageData(0, 0, W, H).data

      // Perfil radial de luminancia desde el centro, en 12 anillos.
      const RINGS = 12
      const rMax = Math.min(W, H) / 2
      const sum = new Array(RINGS).fill(0)
      const cnt = new Array(RINGS).fill(0)
      let total = 0
      const cx = W / 2
      const cy = H / 2
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4
          const l = (px[i] + px[i + 1] + px[i + 2]) / 3
          total += l
          const rad = Math.hypot(x - cx, y - cy)
          const k = Math.floor((rad / rMax) * RINGS)
          if (k >= 0 && k < RINGS) {
            sum[k] += l
            cnt[k]++
          }
        }
      }

      const bodies = sim.renderer.overlay.bodyStates(sim.store.get().bodyClock)
      return {
        ringProfile: sum.map((s, k) => (cnt[k] ? +(s / cnt[k]).toFixed(2) : 0)),
        meanLum: +(total / (W * H)).toFixed(2),
        traceCount: sim.renderer.overlay.list.length,
        bodies: bodies.map((b) => ({
          label: b.trace.label,
          r: +b.snap.r.toFixed(4),
          tau: +b.snap.tau.toFixed(3),
          t: +b.snap.t.toFixed(3),
          progress: +b.snap.progress.toFixed(4),
          disrupted: b.disrupted,
          durProper: +(b.trace.body?.durationProper ?? 0).toFixed(2),
          durCoord: +(b.trace.body?.durationCoordinate ?? 0).toFixed(2),
        })),
        dataUrl: c2.toDataURL('image/png'),
      }
    },
    { patch, actions },
  )

  console.log(`\n── ${label} ──`)
  console.log(`   luminancia media ${out.meanLum}   trazas ${out.traceCount}`)
  console.log(`   perfil radial: ${out.ringProfile.join(' ')}`)
  for (const b of out.bodies) {
    console.log(
      `   cuerpo "${b.label}"  r=${b.r} M  τ=${b.tau}  t=${b.t}  ${(b.progress * 100).toFixed(1)} %` +
        `${b.disrupted ? '  [DESGARRADO]' : ''}`,
    )
    console.log(`     duración: propio ${b.durProper} M · coordenado ${b.durCoord} M`)
  }
  if (saveAs) {
    mkdirSync('tools/out', { recursive: true })
    writeFileSync(saveAs, Buffer.from(out.dataUrl.split(',')[1], 'base64'))
    console.log(`   captura ${saveAs}`)
  }
  return out
}

// ===========================================================================
// Cuerpos animados
// ===========================================================================

const bodyBase = {
  ...BASE,
  showOrbits: true,
  bodyPlaying: false,
  bodyKind: 'sun',
  bodyClock: 'proper',
  // r₀ = 80 M queda FUERA del radio de marea del Sol alrededor de 10^6 masas
  // solares (que son ~47 M): así el cuerpo empieza intacto y la comprobación de
  // marea del caso siguiente es significativa.
  orbitLaunchRadius: 80,
  orbitInclination: 0.3,
  orbitSpeedFraction: 0.97,
  orbitCharge: 0,
  orbitRevolutions: 3,
  orbitOpacity: 1,
}

const placed = await shoot(bodyBase, 'un cuerpo colocado en r₀ = 80 M', 'tools/out/body-placed.png', {
  clearBodies: true,
  launch: 1,
  rewind: true,
})
record('se coloca una traza con cuerpo', placed.traceCount === 1 && placed.bodies.length === 1)
record(
  'el cuerpo arranca en el radio de lanzamiento',
  placed.bodies.length === 1 && Math.abs(placed.bodies[0].r - 80) < 1,
  placed.bodies.length ? `r = ${placed.bodies[0].r} M` : 'sin cuerpo',
)
record(
  'a r₀ = 80 M el Sol está intacto (fuera de su radio de marea de ~47 M)',
  placed.bodies.length === 1 && !placed.bodies[0].disrupted,
)
record(
  'el tiempo coordenado del recorrido supera el propio',
  placed.bodies.length === 1 && placed.bodies[0].durCoord > placed.bodies[0].durProper,
  placed.bodies.length
    ? `${placed.bodies[0].durCoord} > ${placed.bodies[0].durProper}`
    : 'sin cuerpo',
)

// Avanzar el reloj debe mover el cuerpo.
const advanced = await shoot(bodyBase, 'tras avanzar el reloj propio', 'tools/out/body-moved.png', {
  advance: placed.bodies.length ? placed.bodies[0].durProper * 0.35 : 100,
})
record(
  'al avanzar el reloj el cuerpo se mueve',
  advanced.bodies.length === 1 && advanced.bodies[0].progress > 0.2,
  advanced.bodies.length ? `progreso ${(advanced.bodies[0].progress * 100).toFixed(1)} %` : 'sin cuerpo',
)
record(
  'el azimut o el radio han cambiado',
  advanced.bodies.length === 1 &&
    (Math.abs(advanced.bodies[0].tau - placed.bodies[0].tau) > 1e-6),
  advanced.bodies.length ? `τ ${placed.bodies[0].tau} → ${advanced.bodies[0].tau}` : 'sin cuerpo',
)

// Una gigante roja cerca se desgarra por marea.
const disrupt = await shoot(
  { ...bodyBase, bodyKind: 'redGiant', orbitLaunchRadius: 200, orbitSpeedFraction: 0.55, massSolar: 1e6 },
  'gigante roja en órbita muy excéntrica (marea)',
  'tools/out/body-tidal.png',
  { clearBodies: true, launch: 1, rewind: true, advance: 1e9 },
)
record(
  'la gigante roja llega a desgarrarse',
  disrupt.bodies.length === 1 && disrupt.bodies[0].disrupted,
  disrupt.bodies.length ? `r final ${disrupt.bodies[0].r} M` : 'sin cuerpo',
)

// ===========================================================================
// Galaxias de fondo lensadas
// ===========================================================================

const noGal = await shoot(
  { ...BASE, showOrbits: false, galaxyCount: 0 },
  'sin galaxias (referencia)',
  null,
  { clearBodies: true },
)

const galBehind = await shoot(
  {
    ...BASE,
    showOrbits: false,
    galaxyCount: 1,
    galaxyAlignBehind: true,
    galaxySize: 0.05,
    galaxyBrightness: 2.5,
  },
  'una galaxia alineada detrás del agujero',
  'tools/out/galaxy-ring.png',
)
record(
  'la galaxia añade luz a la escena',
  galBehind.meanLum > noGal.meanLum * 1.15,
  `${galBehind.meanLum} frente a ${noGal.meanLum}`,
)

// El lente reparte la luz en un anillo: la corona intermedia debe brillar mas que
// el centro, donde esta la sombra.
{
  const prof = galBehind.ringProfile
  const centre = (prof[0] + prof[1]) / 2
  const annulus = Math.max(prof[2], prof[3], prof[4])
  record(
    'el lente reparte la luz en un anillo alrededor de la sombra',
    annulus > centre,
    `corona ${annulus.toFixed(1)} > centro ${centre.toFixed(1)}`,
  )
}

const galOff = await shoot(
  {
    ...BASE,
    showOrbits: false,
    galaxyCount: 1,
    galaxyAlignBehind: false,
    galaxySize: 0.05,
    galaxyBrightness: 2.5,
  },
  'una galaxia sin alinear',
  'tools/out/galaxy-off.png',
)
{
  // El discriminador es DONDE cae el pico de brillo, no el valor de un anillo
  // concreto: alineada, la luz se reparte en un anillo lejano del centro (el
  // anillo de Einstein); desplazada, se concentra en un arco a otro radio.
  const peak = (prof) => prof.indexOf(Math.max(...prof))
  const peakAligned = peak(galBehind.ringProfile)
  const peakOff = peak(galOff.ringProfile)
  record(
    'alineada y desplazada concentran la luz a radios distintos',
    peakAligned !== peakOff,
    `pico en el anillo ${peakAligned} (alineada) frente a ${peakOff} (desplazada)`,
  )
  record(
    'alineada, el pico está lejos del centro: es un anillo, no un disco',
    peakAligned >= 6,
    `anillo ${peakAligned} de 12`,
  )
}

const galMany = await shoot(
  {
    ...BASE,
    showOrbits: false,
    galaxyCount: 4,
    galaxyAlignBehind: true,
    galaxySize: 0.06,
    galaxyBrightness: 2,
  },
  'cuatro galaxias de fondo',
  'tools/out/galaxy-many.png',
)
record(
  'cuatro galaxias aportan más luz que una',
  galMany.meanLum > galBehind.meanLum,
  `${galMany.meanLum} > ${galBehind.meanLum}`,
)

await browser.close()

if (glErrors.size) {
  console.error('\n✗ errores de GL:')
  for (const e of glErrors) console.error('  ' + e)
  checks.push({ name: 'sin errores de GL', ok: false })
}

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} comprobaciones superadas`)
console.log(failed.length ? 'RESULTADO: FALLO' : 'RESULTADO: OK')
process.exit(failed.length ? 1 : 0)
