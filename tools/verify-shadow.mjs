/**
 * Verificacion end-to-end del trazador en GPU contra resultados analiticos.
 *
 * Es la puerta de validacion mas fuerte del proyecto: mide el radio de la sombra
 * DIRECTAMENTE EN PIXELES de la imagen que produce el shader y lo compara con la
 * prediccion cerrada. Los tests de vitest validan la fisica en CPU; esto valida
 * que el shader implementa esa misma fisica.
 *
 * Casos comprobados:
 *   Schwarzschild   radio de sombra = sqrt(27) M          (circular)
 *   RN extremal     radio de sombra = 4 M                 (circular, mas pequena)
 *   Kerr a=0.9      sombra asimetrica, borde plano prograde
 *   carga creciente la sombra se contrae monotonamente
 *
 * La conversion angulo -> pixel se deriva de como el shader construye el rayo:
 *   ndc.y = tan(theta) / tan(fov/2),  pixel = ndc.y * altura/2
 * de modo que  r_pix = (altura/2) * tan(theta_sombra) / tan(fov/2).
 */

import { chromium } from 'playwright'

const baseUrl = process.argv[2] ?? 'http://localhost:5173'
const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}capture=1`

/**
 * Si la pagina se recarga a mitad de una medicion, Playwright lanza
 * "Execution context was destroyed" con una traza que no dice nada util. La causa
 * casi siempre es el HMR de Vite recargando tras editar un archivo de src/
 * mientras la verificacion corria.
 */
process.on('uncaughtException', (e) => {
  const msg = String(e?.message ?? e)
  if (/Execution context was destroyed|Target (page|closed)|Target closed/.test(msg)) {
    console.error(
      '\n✗ La página se recargó a mitad de la medición.\n' +
        '  Causa habitual: el HMR de Vite recargó la página porque se editó un archivo de\n' +
        '  src/ mientras corría la verificación. Vuelve a ejecutarla sin tocar el código.',
    )
    process.exit(2)
  }
  console.error(e)
  process.exit(1)
})

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 640, height: 640 } })
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
page.on('console', (m) => {
  if (/GL_INVALID/.test(m.text())) console.log(`[gl] ${m.text()}`)
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

/**
 * Configura la escena, espera convergencia y mide el radio de la sombra
 * disparando rayos radiales desde el centro del canvas hasta encontrar el borde
 * de la region negra.
 */
async function measure(patch, label) {
  const result = await page.evaluate(
    async ({ patch }) => {
      const sim = window.__sim
      sim.store.patch({
        // Sin disco ni capas: la sombra debe recortarse contra el fondo estelar,
        // que es la unica fuente detras de ella.
        diskEnabled: false,
        starsEnabled: true,
        starIntensity: 2.5,
        starDensity: 1,
        milkyWayIntensity: 2.2,
        showHorizon: false,
        showErgosphere: false,
        showPhotonSphere: false,
        showIsco: false,
        showDragGrid: false,
        bloomEnabled: false,
        timeWarp: 0,
        exposure: 3,
        autoExposure: true,
        // La calidad adaptativa DEBE estar desactivada: baja la resolucion interna
        // segun la velocidad de la GPU, y la medicion del borde de la sombra
        // depende de la resolucion. Con ella activa la medida deja de ser
        // reproducible (se observo un desplazamiento del 3 % bajo SwiftShader).
        autoQuality: false,
        mode: 'single',
        renderScale: 1,
        targetSamples: 10,
        // Presupuesto amplio: un rayo sin converger recibe el fondo atenuado en
        // vez de negro, lo que lo hace pasar por "fuera de la sombra" y sesga el
        // radio medido hacia abajo. Con la sombra de canto de Kerr, donde los
        // rayos rozan el anillo de fotones, hace falta holgura.
        maxIter: 2600,
        tolerance: 1e-6,
        rEscape: 400,
        ...patch,
      })

      // Esperar convergencia.
      const t0 = performance.now()
      while (performance.now() - t0 < 240000) {
        await new Promise((r) => requestAnimationFrame(r))
        if (sim.lastStats?.converged) break
      }

      const src = document.getElementById('view')
      const c2 = document.createElement('canvas')
      c2.width = src.width
      c2.height = src.height
      const ctx = c2.getContext('2d')
      ctx.drawImage(src, 0, 0)
      const img = ctx.getImageData(0, 0, c2.width, c2.height)
      const W = c2.width
      const H = c2.height
      const px = img.data

      const luma = (x, y) => {
        const i = ((H - 1 - y) * W + x) * 4 // getImageData tiene y hacia abajo
        return (px[i] + px[i + 1] + px[i + 2]) / 3
      }

      // Umbral: la sombra es exactamente 0; el fondo tiene senal en casi todo
      // pixel gracias a la banda galactica saturada.
      const THRESH = 2.0

      /**
       * Radio del borde de la sombra desde (ox, oy) en la direccion `ang`.
       * Exige un tramo continuo con senal para no confundir un hueco oscuro del
       * fondo, justo fuera del borde, con el borde mismo.
       */
      const edgeAt = (ox, oy, ang) => {
        const dx = Math.cos(ang)
        const dy = Math.sin(ang)
        const maxR = Math.min(W, H) / 2 - 2
        let run = 0
        for (let r = 2; r < maxR; r += 0.25) {
          const x = Math.round(ox + dx * r)
          const y = Math.round(oy + dy * r)
          if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) break
          if (luma(x, y) > THRESH) {
            run += 0.25
            if (run >= 1.5) return r - run
          } else {
            run = 0
          }
        }
        return NaN
      }

      const N = 720
      /** Muestra el contorno desde un origen dado. */
      const contour = (ox, oy) => {
        const out = []
        for (let i = 0; i < N; i++) {
          const ang = (2 * Math.PI * i) / N
          const r = edgeAt(ox, oy, ang)
          if (Number.isFinite(r)) out.push({ ang, r })
        }
        return out
      }

      /** Area y centroide del poligono radial, en coordenadas absolutas. */
      const polyStats = (pts, ox, oy) => {
        let a2 = 0
        let cx = 0
        let cy = 0
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i]
          const p2 = pts[(i + 1) % pts.length]
          const x1 = ox + p1.r * Math.cos(p1.ang)
          const y1 = oy + p1.r * Math.sin(p1.ang)
          const x2 = ox + p2.r * Math.cos(p2.ang)
          const y2 = oy + p2.r * Math.sin(p2.ang)
          const cross = x1 * y2 - x2 * y1
          a2 += cross
          cx += (x1 + x2) * cross
          cy += (y1 + y2) * cross
        }
        const area = Math.abs(a2 / 2)
        return {
          area,
          cx: a2 !== 0 ? cx / (3 * a2) : ox,
          cy: a2 !== 0 ? cy / (3 * a2) : oy,
        }
      }

      // Paso 1: contorno desde el centro de la imagen, para hallar el centroide.
      // El arrastre de marcos DESPLAZA la sombra respecto al centro, asi que
      // medir radios desde el centro de la imagen mezclaria desplazamiento con
      // forma. shadowMetrics mide desde el centroide, y aqui se hace igual.
      const first = contour(W / 2, H / 2)
      const st1 = polyStats(first, W / 2, H / 2)

      // Paso 2: contorno definitivo desde el centroide.
      const radii = contour(st1.cx, st1.cy)
      const st2 = polyStats(radii, st1.cx, st1.cy)

      const rs = radii.map((v) => v.r)
      const mean = rs.reduce((a, b) => a + b, 0) / rs.length
      const areal = Math.sqrt(st2.area / Math.PI)

      // Percentiles en vez de min/max: un unico rayo que atraviese un hueco
      // oscuro del fondo, o un pixel sin converger, arruina los extremos y con
      // ellos cualquier medida de asimetria basada en (max-min).
      const sorted = [...rs].sort((a, b) => a - b)
      const pct = (f) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))]
      const p05 = pct(0.05)
      const p95 = pct(0.95)

      const near = (target) => {
        let best = null
        for (const v of radii) {
          const d = Math.abs(Math.atan2(Math.sin(v.ang - target), Math.cos(v.ang - target)))
          if (!best || d < best.d) best = { d, r: v.r }
        }
        return best?.r ?? NaN
      }

      // Desplazamiento del centroide respecto al centro de la imagen: es la
      // firma directa del arrastre de marcos.
      const offsetX = st1.cx - W / 2
      const offsetY = st1.cy - H / 2

      const p = sim.store.get()
      const d = sim.store.getDerived()

      return {
        samples: radii.length,
        meanPix: mean,
        arealPix: areal,
        minPix: p05,
        maxPix: p95,
        absMinPix: Math.min(...rs),
        absMaxPix: Math.max(...rs),
        leftPix: near(Math.PI),
        rightPix: near(0),
        topPix: near(Math.PI / 2),
        offsetX,
        offsetY,
        canvas: { W, H },
        fov: p.fov,
        camDistanceRg: d.camDistanceRg,
        predictedAngularRad: d.shadowAngularRad,
        predictedArealM: d.shadowArealRadius,
        predictedAsymmetry: d.shadowAsymmetry,
        spin: p.spin,
        charge: p.charge,
      }
    },
    { patch },
  )

  // Angulo -> pixel, con la misma construccion de rayo que el shader.
  const pixPerTan = result.canvas.H / 2 / Math.tan(result.fov / 2)
  const predictedPix = pixPerTan * Math.tan(result.predictedAngularRad)
  // De vuelta a unidades de M para comparar con sqrt(27), 4, etc.
  const measuredAngular = Math.atan(result.arealPix / pixPerTan)
  const measuredM =
    (Math.sin(measuredAngular) * result.camDistanceRg) /
    Math.sqrt(1 - 2 / result.camDistanceRg + result.charge ** 2 / result.camDistanceRg ** 2)

  const errPct = (100 * (result.arealPix - predictedPix)) / predictedPix
  const measuredAsym = (result.maxPix - result.minPix) / (result.maxPix + result.minPix)

  console.log(`\n── ${label} ──  a=${result.spin}  q=${result.charge}`)
  console.log(`   muestras del borde     ${result.samples}/720`)
  console.log(
    `   radio areal medido     ${result.arealPix.toFixed(2)} px   (predicho ${predictedPix.toFixed(2)} px)`,
  )
  console.log(`   error                  ${errPct >= 0 ? '+' : ''}${errPct.toFixed(2)} %`)
  console.log(
    `   -> en unidades de M    ${measuredM.toFixed(4)}   (analitico ${result.predictedArealM.toFixed(4)})`,
  )
  console.log(
    `   izq/der/arriba (px)    ${result.leftPix.toFixed(1)} / ${result.rightPix.toFixed(1)} / ${result.topPix.toFixed(1)}   (desde el centroide)`,
  )
  console.log(
    `   asimetria medida       ${measuredAsym.toFixed(4)}   (analitica ${result.predictedAsymmetry.toFixed(4)})   [percentiles 5-95]`,
  )
  console.log(
    `   radios p05/p95 (px)    ${result.minPix.toFixed(1)} / ${result.maxPix.toFixed(1)}   extremos ${result.absMinPix.toFixed(1)} / ${result.absMaxPix.toFixed(1)}`,
  )
  console.log(
    `   desplaz. del centroide ${result.offsetX >= 0 ? '+' : ''}${result.offsetX.toFixed(1)} px en x, ${result.offsetY >= 0 ? '+' : ''}${result.offsetY.toFixed(1)} px en y`,
  )

  return { ...result, predictedPix, measuredM, errPct, measuredAsym }
}

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, ok, detail })
  console.log(`   ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// --- Schwarzschild: la sombra debe medir sqrt(27) M = 5.196 M ---------------
const sch = await measure({ spin: 0, charge: 0, inclination: Math.PI / 2, distanceRg: 40 }, 'Schwarzschild')
record(
  'radio de sombra = sqrt(27) M dentro del 3 %',
  Math.abs(sch.measuredM / Math.sqrt(27) - 1) < 0.03,
  `medido ${sch.measuredM.toFixed(4)} M vs ${Math.sqrt(27).toFixed(4)} M`,
)
record('sombra circular (asimetria < 0.03)', sch.measuredAsym < 0.03, `${sch.measuredAsym.toFixed(4)}`)

// --- Reissner-Nordstrom extremal: la sombra debe medir 4 M -----------------
const rn = await measure({ spin: 0, charge: 1, inclination: Math.PI / 2, distanceRg: 40 }, 'RN extremal (q=1)')
record(
  'radio de sombra = 4 M dentro del 3 %',
  Math.abs(rn.measuredM / 4 - 1) < 0.03,
  `medido ${rn.measuredM.toFixed(4)} M vs 4 M`,
)
record('la carga contrae la sombra', rn.arealPix < sch.arealPix, `${rn.arealPix.toFixed(1)} < ${sch.arealPix.toFixed(1)} px`)

record(
  'sin espin la sombra esta centrada',
  Math.abs(sch.offsetX) < 0.03 * sch.arealPix,
  `desplazamiento ${Math.abs(sch.offsetX).toFixed(1)} px`,
)

// --- Kerr a=0.9 visto de canto: sombra asimetrica y desplazada ------------
const kerr = await measure({ spin: 0.9, charge: 0, inclination: Math.PI / 2, distanceRg: 40 }, 'Kerr a=0.9 de canto')
record(
  'radio areal de Kerr dentro del 3 % del analitico',
  Math.abs(kerr.measuredM / kerr.predictedArealM - 1) < 0.03,
  `medido ${kerr.measuredM.toFixed(4)} M vs ${kerr.predictedArealM.toFixed(4)} M`,
)
record(
  'la sombra de Kerr es asimetrica (forma, desde el centroide)',
  kerr.measuredAsym > 2 * sch.measuredAsym,
  `${kerr.measuredAsym.toFixed(4)} frente a ${sch.measuredAsym.toFixed(4)} de Schwarzschild`,
)
record(
  'el arrastre de marcos desplaza la sombra',
  Math.abs(kerr.offsetX) > 0.1 * kerr.arealPix,
  `desplazamiento ${kerr.offsetX.toFixed(1)} px = ${((100 * Math.abs(kerr.offsetX)) / kerr.arealPix).toFixed(0)} % del radio`,
)
record(
  'el espin encoge la sombra respecto a Schwarzschild',
  kerr.arealPix < sch.arealPix,
  `${kerr.arealPix.toFixed(1)} < ${sch.arealPix.toFixed(1)} px`,
)

// --- Kerr a poca inclinacion: la sombra vuelve a ser casi circular --------
// Se mide a 20 grados y no a ~0: en el eje exacto, las coordenadas de
// Boyer-Lindquist tienen una singularidad (los terminos 1/sin(theta) del
// integrador) y la precision del shader se degrada. Es una limitacion conocida
// y documentada; a 20 grados ya se esta fuera de esa region.
const polar = await measure(
  { spin: 0.9, charge: 0, inclination: (20 * Math.PI) / 180, distanceRg: 40 },
  'Kerr a=0.9 a 20 grados',
)
record(
  'a baja inclinacion la sombra es casi circular pese al espin maximo',
  polar.measuredAsym < 0.08,
  `${polar.measuredAsym.toFixed(4)}`,
)
record(
  'a baja inclinacion el desplazamiento es menor que de canto',
  Math.abs(polar.offsetX) < Math.abs(kerr.offsetX),
  `${Math.abs(polar.offsetX).toFixed(1)} px < ${Math.abs(kerr.offsetX).toFixed(1)} px`,
)

await browser.close()

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} comprobaciones superadas`)
console.log(failed.length ? 'RESULTADO: FALLO' : 'RESULTADO: OK')
process.exit(failed.length ? 1 : 0)
