/** Diagnostico: volca el estado del DOM, del contexto GL y los errores. */

import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5199'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 900, height: 620 } })

page.on('console', (m) => console.log(`[console.${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => console.log(`[pageerror] ${e.stack ?? e.message}`))
page.on('requestfailed', (r) =>
  console.log(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText}`),
)
page.on('response', (r) => {
  if (r.status() >= 400) console.log(`[http ${r.status()}] ${r.url()}`)
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3000)

const dump = await page.evaluate(() => {
  const info = (id) => {
    const n = document.getElementById(id)
    if (!n) return { exists: false }
    const cs = getComputedStyle(n)
    const r = n.getBoundingClientRect()
    return {
      exists: true,
      hidden: n.hidden,
      childCount: n.childElementCount,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      background: cs.backgroundColor,
      color: cs.color,
      textSnippet: (n.innerText ?? '').slice(0, 120).replace(/\s+/g, ' '),
    }
  }

  const canvas = document.getElementById('view')
  const gl = canvas?.getContext('webgl2')

  return {
    title: document.title,
    stylesheetCount: document.styleSheets.length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    simHook: !!window.__sim,
    simStats: window.__sim?.lastStats ?? null,
    glError: gl ? gl.getError() : 'no-context',
    canvasSize: canvas ? { w: canvas.width, h: canvas.height, cw: canvas.clientWidth, ch: canvas.clientHeight } : null,
    nodes: {
      view: info('view'),
      notice: info('notice'),
      panel: info('panel'),
      panelBody: info('panel-body'),
      hud: info('hud'),
      hudBody: info('hud-body'),
      stats: info('stats'),
      warnings: info('warnings'),
    },
  }
})

console.log('\n=== DUMP ===')
console.log(JSON.stringify(dump, null, 2))

await browser.close()
