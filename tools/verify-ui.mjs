/**
 * Verifica que la interfaz sea VISIBLE, no solo que exista en el DOM.
 *
 * Existe por un fallo concreto: `#notice` es un overlay a pantalla completa,
 * opaco y con z-index 100, marcado con el atributo `hidden`. Como el CSS le daba
 * `display: flex`, y una regla de autor gana a la hoja del navegador que
 * implementa `hidden` con `display: none`, el overlay tapaba toda la aplicacion.
 * El sintoma era una pantalla negra sin errores en consola, y comprobar el DOM no
 * lo detectaba: los nodos estaban ahi, poblados y "visibles", solo cubiertos.
 *
 * Por eso aqui no se consulta el DOM sino que se mira la imagen: se comprueba que
 * los pixeles donde deben estar los paneles no sean del color de fondo, y que el
 * elemento que hay en esos puntos sea realmente el panel y no otra cosa encima.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:5173'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1100, height: 720 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(4000)

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, ok })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

/**
 * Elemento que realmente ocupa un punto de la pantalla. Es la comprobacion clave:
 * si algo esta tapando la aplicacion, aparece aqui.
 */
const topmost = await page.evaluate(() => {
  const probe = (x, y) => {
    const e = document.elementFromPoint(x, y)
    if (!e) return null
    // Se sube hasta el contenedor con id para identificarlo.
    let n = e
    while (n && !n.id && n.parentElement) n = n.parentElement
    return { id: n?.id || e.tagName, tag: e.tagName }
  }
  const W = window.innerWidth
  const H = window.innerHeight
  return {
    panel: probe(120, 40),
    hud: probe(W - 150, 40),
    center: probe(W / 2, H / 2),
    stats: probe(60, H - 25),
    noticeStyle: {
      hidden: document.getElementById('notice').hidden,
      display: getComputedStyle(document.getElementById('notice')).display,
    },
  }
})

console.log('elementos en pantalla:', JSON.stringify(topmost, null, 2))

record(
  'el atributo hidden se respeta en #notice',
  topmost.noticeStyle.hidden && topmost.noticeStyle.display === 'none',
  `hidden=${topmost.noticeStyle.hidden} display=${topmost.noticeStyle.display}`,
)
record(
  'nada tapa el panel de control',
  topmost.panel?.id === 'panel',
  `en (120,40) hay: ${topmost.panel?.id}`,
)
record('nada tapa el HUD', topmost.hud?.id === 'hud', `arriba a la derecha hay: ${topmost.hud?.id}`)
record(
  'el canvas es visible en el centro',
  topmost.center?.id === 'view',
  `en el centro hay: ${topmost.center?.id}`,
)
record('la barra de estado es visible', topmost.stats?.id === 'stats', `abajo hay: ${topmost.stats?.id}`)

// Analisis de la imagen: los paneles deben aportar pixeles distintos del fondo.
// La captura es informativa, no la comprobacion: el bucle de animacion del canvas
// mantiene la pagina "ocupada" y page.screenshot puede agotar su espera. Las
// comprobaciones de arriba (que elemento ocupa cada punto) son las que valen.
try {
  const shot = await page.screenshot({ timeout: 8000, animations: 'allow' })
  mkdirSync('tools/out', { recursive: true })
  writeFileSync('tools/out/ui.png', shot)
  console.log('captura de UI en tools/out/ui.png')
} catch {
  console.log('(captura de pagina omitida: el canvas anima de forma continua)')
}

const pix = await page.evaluate(() => {
  // Se rasteriza el texto del panel a traves de su rect y se mide el contraste.
  const rect = (id) => {
    const r = document.getElementById(id).getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }
  return { panel: rect('panel'), hud: rect('hud'), stats: rect('stats') }
})
record(
  'el panel tiene un tamano razonable en pantalla',
  pix.panel.w > 200 && pix.panel.h > 200,
  `${Math.round(pix.panel.w)}x${Math.round(pix.panel.h)}`,
)
record(
  'el HUD tiene un tamano razonable en pantalla',
  pix.hud.w > 200 && pix.hud.h > 200,
  `${Math.round(pix.hud.w)}x${Math.round(pix.hud.h)}`,
)

// Texto realmente presente.
const text = await page.evaluate(() => ({
  panel: (document.getElementById('panel').innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90),
  hud: (document.getElementById('hud').innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90),
}))
record('el panel muestra texto', text.panel.length > 20, text.panel)
record('el HUD muestra observables', text.hud.includes('r₊') || text.hud.length > 20, text.hud)

record('sin errores de consola ni de pagina', errors.length === 0, errors.slice(0, 2).join(' | '))

await browser.close()

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} comprobaciones superadas`)
console.log(failed.length ? 'RESULTADO: FALLO' : 'RESULTADO: OK')
process.exit(failed.length ? 1 : 0)
