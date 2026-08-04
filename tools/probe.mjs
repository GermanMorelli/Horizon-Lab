/**
 * Sonda: lee el FBO de acumulacion directamente para distinguir "el trazador no
 * produjo radiancia" de "la captura del canvas falla".
 *
 * El FBO de acumulacion es un framebuffer propio y siempre legible, al contrario
 * que el framebuffer por defecto con preserveDrawingBuffer:false.
 */

import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 700, height: 500 } })
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
page.on('console', (m) => {
  const t = m.text()
  if (m.type() === 'error' || /GL_INVALID/.test(t)) console.log(`[${m.type()}] ${t}`)
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.evaluate(() =>
  window.__sim.store.patch({ renderScale: 0.25, targetSamples: 2, maxIter: 400 }),
)
await page.waitForTimeout(6000)

const probe = await page.evaluate(() => {
  const r = window.__sim.renderer
  const gl = r.gl
  const latest = r.latest
  if (!latest) return { error: 'no hay objetivo de acumulacion' }

  // Leer el FBO de acumulacion (RGBA16F) como float.
  gl.bindFramebuffer(gl.FRAMEBUFFER, latest.fbo)
  const w = latest.width
  const h = latest.height
  const buf = new Float32Array(w * h * 4)
  let readErr = null
  try {
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, buf)
  } catch (e) {
    readErr = String(e)
  }
  const glErr = gl.getError()

  let maxR = 0
  let sum = 0
  let nonZero = 0
  let nan = 0
  for (let i = 0; i < buf.length; i += 4) {
    const v = Math.max(buf[i], buf[i + 1], buf[i + 2])
    if (Number.isNaN(v)) {
      nan++
      continue
    }
    if (v > maxR) maxR = v
    sum += v
    if (v > 1e-6) nonZero++
  }
  const n = buf.length / 4

  // Muestra del centro y de una esquina, para ver disco vs fondo.
  const at = (x, y) => {
    const i = (y * w + x) * 4
    return [buf[i], buf[i + 1], buf[i + 2]].map((v) => +v.toFixed(5))
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return {
    accumSize: { w, h },
    readErr,
    glErr,
    maxRadiance: +maxR.toFixed(5),
    meanRadiance: +(sum / n).toFixed(6),
    nonZeroFraction: +(nonZero / n).toFixed(4),
    nanCount: nan,
    center: at(w >> 1, h >> 1),
    quarter: at(w >> 2, h >> 1),
    corner: at(2, 2),
    topEdge: at(w >> 1, h - 3),
    exposureUsed: r.exposure ? 'n/a' : 'n/a',
    autoExposureScale: r.autoExposureScale,
    stats: window.__sim.lastStats,
  }
})

console.log('=== SONDA DEL ACUMULADOR ===')
console.log(JSON.stringify(probe, null, 2))

// Y ahora leer el framebuffer por defecto DENTRO del rAF, antes de que se pierda.
const canvasProbe = await page.evaluate(
  () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const c = document.getElementById('view')
          const gl = c.getContext('webgl2')
          gl.bindFramebuffer(gl.FRAMEBUFFER, null)
          const px = new Uint8Array(4 * 64 * 64)
          gl.readPixels(
            (c.width >> 1) - 32,
            (c.height >> 1) - 32,
            64,
            64,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            px,
          )
          let max = 0
          let sum = 0
          for (let i = 0; i < px.length; i += 4) {
            const l = Math.max(px[i], px[i + 1], px[i + 2])
            if (l > max) max = l
            sum += l
          }
          resolve({ maxByte: max, meanByte: +(sum / (px.length / 4)).toFixed(2) })
        })
      })
    }),
)
console.log('=== FRAMEBUFFER POR DEFECTO (dentro de rAF) ===')
console.log(JSON.stringify(canvasProbe))

await browser.close()
