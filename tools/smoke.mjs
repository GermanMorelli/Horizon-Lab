/**
 * Prueba de humo en GPU: carga la app en Chromium, comprueba que los shaders
 * compilan y enlazan, espera a que la imagen converja y guarda un PNG.
 *
 * Uso:  node tools/smoke.mjs [--url http://localhost:5173] [--out out.png]
 *       [--preset id] [--samples N] [--wait ms]
 *
 * Se ejecuta con --use-angle=swiftshader para que funcione sin GPU real: es un
 * rasterizador software, lento pero suficiente para validar que el GLSL compila
 * y que el trazador produce la imagen esperada.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : def
}

// `capture=1` hace que la app conserve el buffer de dibujo: sin el, el contenido
// del canvas queda indefinido tras la composicion y cualquier lectura desde
// fuera de un callback de rAF devuelve negro, aunque la imagen sea correcta.
const rawUrl = arg('url', 'http://localhost:5173')
const url = rawUrl.includes('capture=') ? rawUrl : `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}capture=1`
const out = resolve(arg('out', 'tools/out/smoke.png'))
const preset = arg('preset', null)
const waitMs = Number(arg('wait', 45000))
const targetSamples = Number(arg('samples', 4))
const scale = Number(arg('scale', 0.3))

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

const page = await browser.newPage({ viewport: { width: 900, height: 620 } })

const consoleErrors = []
const pageErrors = []
const glErrors = new Set()
page.on('console', (m) => {
  const text = m.text()
  if (m.type() === 'error') consoleErrors.push(text)
  // Los errores de GL llegan como warnings de consola, no como excepciones: un
  // drawArrays rechazado deja el canvas negro sin ningun error de compilacion.
  if (/GL_INVALID|GL_OUT_OF_MEMORY|WebGL:.*error/i.test(text)) glErrors.add(text.slice(0, 200))
})
page.on('pageerror', (e) => pageErrors.push(e.message ?? String(e)))

console.log(`→ cargando ${url}`)
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

// El aviso a pantalla completa indica un fallo fatal (WebGL2 o compilacion).
const notice = await page.evaluate(() => {
  const n = document.getElementById('notice')
  return n && !n.hidden ? n.innerText : null
})
if (notice) {
  console.error('\n✗ FALLO FATAL EN LA APP:\n' + notice)
  await browser.close()
  process.exit(1)
}

// Informe de capacidades del contexto.
const caps = await page.evaluate(() => {
  const c = document.createElement('canvas')
  const gl = c.getContext('webgl2')
  if (!gl) return { webgl2: false }
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  return {
    webgl2: true,
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?',
    colorBufferFloat: !!gl.getExtension('EXT_color_buffer_float'),
  }
})
console.log('→ contexto:', JSON.stringify(caps))

// Bajar el coste para que SwiftShader termine en un tiempo razonable.
await page.evaluate(
  ({ s, spp }) => {
    const w = window
    if (w.__sim) w.__sim.store.patch({ renderScale: s, targetSamples: spp, maxIter: 420 })
  },
  { s: scale, spp: targetSamples },
)

// Lanza N particulas de prueba a radios escalonados, para verificar el overlay.
const orbits = Number(arg('orbits', 0))
if (orbits > 0) {
  await page.evaluate(
    ({ n }) => {
      const sim = window.__sim
      sim.store.patch({ showOrbits: true, orbitRevolutions: 5 })
      for (let i = 0; i < n; i++) {
        sim.store.patch({
          orbitLaunchRadius: 10 + i * 6,
          orbitInclination: (i * 18 * Math.PI) / 180,
          orbitSpeedFraction: 0.94 + 0.02 * i,
          orbitCharge: i % 2 === 0 ? 0 : 0.5,
        })
        sim.launchOrbit()
      }
    },
    { n: orbits },
  )
  const count = await page.evaluate(() => window.__sim.renderer.overlay.list.length)
  console.log(`→ orbitas trazadas: ${count}`)
  if (count !== orbits) {
    console.error(`✗ se esperaban ${orbits} orbitas, hay ${count}`)
    process.exitCode = 1
  }
}

if (preset) {
  const ok = await page.evaluate((id) => {
    const w = window
    if (!w.__sim) return false
    const p = w.__sim.presets.find((x) => x.id === id)
    if (!p) return false
    w.__sim.applyPreset(p)
    return true
  }, preset)
  if (!ok) {
    console.error(`✗ preset desconocido: ${preset}`)
    await browser.close()
    process.exit(1)
  }
  console.log(`→ preset aplicado: ${preset}`)
}

// Esperar convergencia leyendo las estadisticas que expone la app.
console.log('→ esperando convergencia…')
const t0 = Date.now()
let last = null
while (Date.now() - t0 < waitMs) {
  last = await page.evaluate(() => window.__sim?.lastStats ?? null)
  if (last?.converged) break
  await page.waitForTimeout(500)
}
const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
console.log(`→ estadisticas tras ${elapsed}s:`, JSON.stringify(last))

/**
 * Analiza el canvas volviendolo a dibujar en un canvas 2D.
 *
 * No se usa gl.readPixels: con preserveDrawingBuffer:false el buffer trasero
 * queda indefinido tras la composicion y readPixels devuelve ceros aunque la
 * imagen sea correcta. drawImage sobre un canvas 2D lee lo que se ve de verdad.
 */
const analysis = await page.evaluate(() => {
  const src = document.getElementById('view')
  const c2 = document.createElement('canvas')
  c2.width = src.width
  c2.height = src.height
  const ctx = c2.getContext('2d')
  ctx.drawImage(src, 0, 0)
  const px = ctx.getImageData(0, 0, c2.width, c2.height).data

  let sum = 0
  let max = 0
  let nonBlack = 0
  let darkest = 255
  let colored = 0
  const histo = new Array(8).fill(0)
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    const l = (r + g + b) / 3
    sum += l
    if (l > max) max = l
    if (l < darkest) darkest = l
    if (l > 6) nonBlack++
    if (Math.max(r, g, b) - Math.min(r, g, b) > 12) colored++
    histo[Math.min(7, l >> 5)]++
  }
  const n = px.length / 4
  return {
    width: c2.width,
    height: c2.height,
    meanLuma: +(sum / n).toFixed(2),
    maxLuma: max,
    minLuma: darkest,
    nonBlackFraction: +(nonBlack / n).toFixed(4),
    coloredFraction: +(colored / n).toFixed(4),
    histogram: histo.map((c) => +(c / n).toFixed(4)),
  }
})
console.log('→ analisis del canvas:', JSON.stringify(analysis))

// La captura se extrae con toDataURL desde la pagina. El screenshot de elemento
// de Playwright devuelve negro sobre este canvas WebGL aunque la imagen sea
// correcta; toDataURL (con capture=1) lee el contenido real.
const dataUrl = await page.evaluate(() => {
  const src = document.getElementById('view')
  const c2 = document.createElement('canvas')
  c2.width = src.width
  c2.height = src.height
  c2.getContext('2d').drawImage(src, 0, 0)
  return c2.toDataURL('image/png')
})
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'))
console.log(`→ captura guardada en ${out}`)

// También una captura de toda la página, para revisar la UI.
const full = out.replace(/\.png$/, '-ui.png')
writeFileSync(full, await page.screenshot())
console.log(`→ captura de UI en ${full}`)

await browser.close()

// --- Veredicto -------------------------------------------------------------
let failed = false

if (pageErrors.length) {
  console.error('\n✗ errores de pagina:')
  for (const e of pageErrors) console.error('  ' + e)
  failed = true
}
if (consoleErrors.length) {
  console.error('\n✗ errores de consola:')
  for (const e of consoleErrors) console.error('  ' + e)
  failed = true
}
if (glErrors.size) {
  console.error('\n✗ errores de GL (un drawArrays rechazado deja el canvas negro):')
  for (const e of glErrors) console.error('  ' + e)
  failed = true
}
if (analysis.maxLuma < 10) {
  console.error('\n✗ el canvas esta practicamente negro: el trazador no produjo imagen.')
  failed = true
}
if (analysis.nonBlackFraction < 0.01) {
  console.error('\n✗ menos del 1% de los pixeles tiene senal.')
  failed = true
}
if (!last) {
  console.error('\n✗ la app no expuso estadisticas de render.')
  failed = true
}

console.log(failed ? '\nRESULTADO: FALLO' : '\nRESULTADO: OK')
process.exit(failed ? 1 : 0)
