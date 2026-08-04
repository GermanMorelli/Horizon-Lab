/**
 * Verificacion en GPU del trazador de dos agujeros negros (Brill-Lindquist).
 *
 * La prueba fuerte es la misma que en CPU pero medida sobre PIXELES: con m2 -> 0
 * el modo binaria debe reproducir la sombra de Schwarzschild, sqrt(27) M, porque
 * Brill-Lindquist con una sola puntura ES Schwarzschild en coordenadas isotropas.
 * Eso valida el shader nuevo contra un numero analitico, no contra el otro shader.
 *
 * Ademas comprueba que con dos masas comparables hay DOS regiones de sombra
 * separadas, y que al acercarlas se fusionan.
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

/**
 * Configura el modo binaria, espera convergencia y analiza la imagen buscando
 * regiones de sombra (pixeles negros) por componentes conexas.
 */
async function measure(patch, label, saveAs) {
  const out = await page.evaluate(
    async ({ patch }) => {
      const sim = window.__sim
      sim.store.patch({
        mode: 'binary',
        binaryEvolving: false,
        binaryShowGrid: false,
        starsEnabled: true,
        starIntensity: 3,
        starDensity: 1,
        milkyWayIntensity: 2.5,
        bloomEnabled: false,
        autoQuality: false,
        exposure: 3,
        renderScale: 1,
        targetSamples: 6,
        maxIter: 1400,
        tolerance: 1e-6,
        rEscape: 400,
        inclination: Math.PI / 2,
        fov: (40 * Math.PI) / 180,
        distanceMode: 'rg',
        ...patch,
      })
      sim.renderer.resetOrbit(sim.store.get(), sim.store.getDerived())
      sim.renderer.invalidate()

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
      const W = c2.width
      const H = c2.height
      const px = ctx.getImageData(0, 0, W, H).data

      // Mascara de sombra: pixeles practicamente negros.
      const dark = new Uint8Array(W * H)
      let darkCount = 0
      for (let i = 0, k = 0; i < px.length; i += 4, k++) {
        const l = (px[i] + px[i + 1] + px[i + 2]) / 3
        if (l <= 2) {
          dark[k] = 1
          darkCount++
        }
      }

      // Componentes conexas de la mascara, por inundacion iterativa.
      const seen = new Uint8Array(W * H)
      const blobs = []
      const stack = []
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const k0 = y * W + x
          if (!dark[k0] || seen[k0]) continue
          let area = 0
          let sx = 0
          let sy = 0
          let minX = x, maxX = x, minY = y, maxY = y
          stack.length = 0
          stack.push(k0)
          seen[k0] = 1
          while (stack.length) {
            const k = stack.pop()
            const kx = k % W
            const ky = (k - kx) / W
            area++
            sx += kx
            sy += ky
            if (kx < minX) minX = kx
            if (kx > maxX) maxX = kx
            if (ky < minY) minY = ky
            if (ky > maxY) maxY = ky
            // Se ignora el borde de la imagen para no contar el fondo exterior.
            if (kx <= 0 || ky <= 0 || kx >= W - 1 || ky >= H - 1) continue
            for (const nk of [k - 1, k + 1, k - W, k + W]) {
              if (dark[nk] && !seen[nk]) {
                seen[nk] = 1
                stack.push(nk)
              }
            }
          }
          // Solo interesan manchas de tamano apreciable y que no toquen el borde.
          if (area > 40 && minX > 0 && minY > 0 && maxX < W - 1 && maxY < H - 1) {
            blobs.push({
              area,
              cx: sx / area,
              cy: sy / area,
              // Radio areal equivalente.
              rAreal: Math.sqrt(area / Math.PI),
            })
          }
        }
      }
      blobs.sort((a, b) => b.area - a.area)

      const p = sim.store.get()
      const d = sim.store.getDerived()

      // Distancia de la camara a CADA puntura, no al centro de masas.
      // Con masas desiguales el centro de masas no coincide con el agujero, y usar
      // la distancia al origen sesga el radio medido (con reparto 0.98/0.02 y
      // a = 200 el desfase es de 4 M, un 7 %).
      const o = sim.renderer.binaryOrbit
      const M = o.m1 + o.m2
      const r = (o.a * (1 - o.e * o.e)) / (1 + o.e * Math.cos(o.nu))
      const bx = r * Math.cos(o.nu)
      const by = r * Math.sin(o.nu)
      const pos1 = [(-o.m2 / M) * bx, (-o.m2 / M) * by, 0]
      const pos2 = [(o.m1 / M) * bx, (o.m1 / M) * by, 0]

      const D = d.camDistanceRg
      const si = Math.sin(p.inclination)
      const ci = Math.cos(p.inclination)
      const sa = Math.sin(p.azimuth)
      const ca = Math.cos(p.azimuth)
      const cam = [D * si * ca, D * si * sa, D * ci]
      const dist = (q) => Math.hypot(cam[0] - q[0], cam[1] - q[1], cam[2] - q[2])

      return {
        blobs: blobs.slice(0, 4),
        blobCount: blobs.length,
        darkFraction: darkCount / (W * H),
        canvas: { W, H },
        fov: p.fov,
        camDistanceRg: D,
        distTo1: dist(pos1),
        distTo2: dist(pos2),
        m1: d.binaryM1,
        m2: d.binaryM2,
        separation: p.binarySeparation,
        dataUrl: c2.toDataURL('image/png'),
      }
    },
    { patch },
  )

  const pixPerTan = out.canvas.H / 2 / Math.tan(out.fov / 2)
  console.log(`\n── ${label} ──`)
  console.log(
    `   m1/m2 ${out.m1.toFixed(3)}/${out.m2.toFixed(3)}   a = ${out.separation} M   r_obs = ${out.camDistanceRg.toFixed(0)} M`,
  )
  console.log(`   manchas de sombra detectadas: ${out.blobCount}`)
  for (const b of out.blobs) {
    // Radio angular -> unidades de M, con la correccion de distancia finita
    // despreciable a estas distancias.
    const rM = (Math.atan(b.rAreal / pixPerTan) * out.camDistanceRg).toFixed(3)
    console.log(
      `     area ${String(b.area).padStart(6)} px   r_areal ${b.rAreal.toFixed(1)} px  (~${rM} M)` +
        `   centro (${b.cx.toFixed(0)}, ${b.cy.toFixed(0)})`,
    )
  }

  if (saveAs) {
    mkdirSync('tools/out', { recursive: true })
    writeFileSync(saveAs, Buffer.from(out.dataUrl.split(',')[1], 'base64'))
    console.log(`   captura ${saveAs}`)
  }
  return { ...out, pixPerTan }
}

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, ok })
  console.log(`   ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// --- Limite de un solo agujero: debe dar sqrt(27) m1 ----------------------
// Con m2 despreciable y muy alejado, Brill-Lindquist es Schwarzschild isotropo.
// Se toma un reparto muy extremo para que el centro de masas coincida casi con la
// puntura masiva, y aun asi se mide contra la distancia real a ella.
const single = await measure(
  { binaryMassRatio: 0.999, binarySeparation: 400, distanceRg: 60 },
  'límite de un solo agujero (m1 = 0.999 M, m2 muy lejano)',
  'tools/out/binary-single.png',
)
{
  const b = single.blobs[0]
  const ok = !!b
  // Misma conversion que en verify-shadow: sin(theta) = b_c sqrt(-g_tt)/D, con la
  // distancia medida a la PUNTURA y no al centro de masas.
  const D1 = single.distTo1
  const theta = ok ? Math.atan(b.rAreal / single.pixPerTan) : NaN
  const lapseCorr = Math.sqrt(1 - (2 * single.m1) / D1)
  const rM = ok ? (Math.sin(theta) * D1) / lapseCorr : NaN
  const expected = Math.sqrt(27) * single.m1
  console.log(`   distancia a m1: ${D1.toFixed(2)} M   (al origen: ${single.camDistanceRg.toFixed(2)} M)`)
  record('hay una sombra dominante', ok && b.area > 500, ok ? `${b.area} px` : 'ninguna')
  record(
    'su radio es sqrt(27)·m1 dentro del 3 %',
    ok && Math.abs(rM / expected - 1) < 0.03,
    `medido ${rM.toFixed(4)} M vs ${expected.toFixed(4)} M`,
  )
}

// --- Dos agujeros separados: dos sombras ----------------------------------
// La inclinacion es CRITICA aqui. La binaria yace en el plano z = 0 y con nu = 0
// su separacion va a lo largo de x; una camara con inclinacion pi/2 y azimut 0 se
// coloca sobre el eje +x, es decir MIRANDO POR LA LINEA que une los dos agujeros,
// con uno detras del otro. Se mira casi desde el eje orbital para verlos separados.
const FACE_ON = 0.35 // ~20 grados respecto al eje orbital
const pair = await measure(
  { binaryMassRatio: 0.5, binarySeparation: 40, distanceRg: 90, inclination: FACE_ON },
  'dos agujeros iguales, vistos casi desde el eje orbital',
  'tools/out/binary-pair.png',
)
record(
  'se detectan dos regiones de sombra separadas',
  pair.blobs.length >= 2,
  `${pair.blobs.length} manchas`,
)
if (pair.blobs.length >= 2) {
  const [a, b] = pair.blobs
  record(
    'las dos sombras tienen tamaño comparable (masas iguales)',
    Math.abs(a.area / b.area - 1) < 0.7,
    `${a.area} vs ${b.area} px`,
  )
  // Se mide la distancia 2D, no solo la horizontal: el eje de separacion de la
  // binaria (x del mundo) se proyecta sobre el "up" de la camara con azimut 0, asi
  // que las dos sombras aparecen separadas en VERTICAL en la imagen.
  const sep = Math.hypot(a.cx - b.cx, a.cy - b.cy)
  record(
    'están separadas en la imagen',
    sep > 3 * Math.max(a.rAreal, b.rAreal),
    `${sep.toFixed(0)} px de separación frente a radios de ${a.rAreal.toFixed(0)} y ${b.rAreal.toFixed(0)} px`,
  )
}

// --- Masas desiguales: sombras de tamaño desigual -------------------------
const uneven = await measure(
  { binaryMassRatio: 0.8, binarySeparation: 40, distanceRg: 90, inclination: FACE_ON },
  'masas desiguales 80/20',
  'tools/out/binary-uneven.png',
)
if (uneven.blobs.length >= 2) {
  const [big, small] = uneven.blobs
  record(
    'la sombra del agujero masivo es claramente mayor',
    big.area > small.area * 2,
    `${big.area} vs ${small.area} px`,
  )
} else {
  record('se detectan dos sombras con masas desiguales', false, `${uneven.blobs.length} manchas`)
}

// --- Muy cerca: las sombras se aproximan ----------------------------------
const close = await measure(
  { binaryMassRatio: 0.5, binarySeparation: 12, distanceRg: 90, inclination: FACE_ON },
  'dos agujeros muy próximos',
  'tools/out/binary-close.png',
)
record(
  'al acercarse, la fracción de sombra crece o se fusionan',
  close.darkFraction > 0 && close.blobs.length >= 1,
  `${close.blobs.length} manchas, ${(close.darkFraction * 100).toFixed(2)} % oscuro`,
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
