/**
 * Verificacion de la vista de malla del espaciotiempo.
 *
 * Comprueba que se dibuja algo estructurado (no una pantalla vacia ni un borron),
 * que el coloreado por lapso produce el gradiente esperado (oscuro y azulado en el
 * centro, donde el tiempo casi se detiene; claro en el borde), y que la geometria
 * responde a los parametros: mas espin achata la garganta, la carga la contrae.
 *
 * La correccion NUMERICA del embedding (que reproduce la metrica inducida y el
 * limite sqrt(3)/2 de Smarr) se valida en `tests/binary.spec.ts`; aqui solo se
 * comprueba que la vista dibuja lo que ese modulo calcula.
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
const page = await browser.newPage({ viewport: { width: 700, height: 560 } })
const glErrors = new Set()
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
page.on('console', (m) => {
  const t = m.text()
  if (/GL_INVALID|GL_OUT_OF_MEMORY/.test(t)) glErrors.add(t.slice(0, 160))
  if (m.type() === 'error') console.log(`[error] ${t}`)
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

async function measure(patch, label, saveAs) {
  const out = await page.evaluate(
    async ({ patch }) => {
      const sim = window.__sim
      sim.store.patch({
        mode: 'mesh',
        meshShowSurface: true,
        meshShowLapse: true,
        meshShowHorizon: false,
        meshOuterRadius: 18,
        meshHeightScale: 1,
        meshGridDensity: 1,
        spin: 0,
        charge: 0,
        distanceMode: 'rg',
        distanceRg: 45,
        inclination: (65 * Math.PI) / 180,
        azimuth: 0,
        fov: (45 * Math.PI) / 180,
        ...patch,
      })
      // La malla se dibuja en un solo frame: basta esperar dos vsyncs.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
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

      // Fondo del modo malla, para distinguir "pixel dibujado" de "fondo".
      const BG = [Math.round(0.016 * 255), Math.round(0.02 * 255), Math.round(0.035 * 255)]
      let drawn = 0
      let sumLum = 0
      // Luminancia media en un disco central y en una corona exterior: el gradiente
      // de lapso debe hacer el centro mas oscuro que el borde.
      let cIn = 0, nIn = 0, cOut = 0, nOut = 0
      const cx = W / 2
      const cy = H / 2
      const rIn = Math.min(W, H) * 0.08
      const rOut = Math.min(W, H) * 0.36

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4
          const dr = Math.abs(px[i] - BG[0])
          const dg = Math.abs(px[i + 1] - BG[1])
          const db = Math.abs(px[i + 2] - BG[2])
          if (dr + dg + db < 12) continue
          drawn++
          const lum = (px[i] + px[i + 1] + px[i + 2]) / 3
          sumLum += lum
          const rad = Math.hypot(x - cx, y - cy)
          if (rad < rIn) {
            cIn += lum
            nIn++
          } else if (rad > rOut * 0.85 && rad < rOut) {
            cOut += lum
            nOut++
          }
        }
      }

      const d = sim.store.getDerived()
      const p = sim.store.get()
      return {
        drawnFraction: drawn / (W * H),
        meanLum: drawn ? sumLum / drawn : 0,
        lumInner: nIn ? cIn / nIn : NaN,
        lumOuter: nOut ? cOut / nOut : NaN,
        meshDepth: d.meshDepth,
        horizonFails: d.horizonEmbeddingFails,
        properToTen: d.properDistanceToTen,
        rPlus: d.rPlus,
        spin: p.spin,
        charge: p.charge,
        dataUrl: c2.toDataURL('image/png'),
      }
    },
    { patch },
  )

  console.log(`\n── ${label} ──  a=${out.spin} q=${out.charge}`)
  console.log(
    `   píxeles dibujados     ${(out.drawnFraction * 100).toFixed(2)} %   luminancia media ${out.meanLum.toFixed(1)}`,
  )
  console.log(
    `   luminancia centro/borde ${out.lumInner.toFixed(1)} / ${out.lumOuter.toFixed(1)}`,
  )
  console.log(
    `   profundidad de la garganta ${out.meshDepth.toFixed(3)} M   r₊ = ${out.rPlus.toFixed(3)} M`,
  )
  console.log(
    `   distancia propia r₊ → 10M  ${out.properToTen.toFixed(3)} M   (coordenada: ${(10 - out.rPlus).toFixed(3)} M)`,
  )
  if (saveAs) {
    mkdirSync('tools/out', { recursive: true })
    writeFileSync(saveAs, Buffer.from(out.dataUrl.split(',')[1], 'base64'))
    console.log(`   captura ${saveAs}`)
  }
  return out
}

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, ok })
  console.log(`   ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// --- Schwarzschild --------------------------------------------------------
const sch = await measure({ spin: 0, charge: 0 }, 'Schwarzschild', 'tools/out/mesh-schwarzschild.png')
record(
  'se dibuja una malla con estructura apreciable',
  sch.drawnFraction > 0.02 && sch.drawnFraction < 0.6,
  `${(sch.drawnFraction * 100).toFixed(2)} % de píxeles`,
)
record(
  'el gradiente de lapso oscurece el centro respecto al borde',
  sch.lumInner < sch.lumOuter,
  `centro ${sch.lumInner.toFixed(1)} < borde ${sch.lumOuter.toFixed(1)}`,
)
record(
  'la distancia propia al horizonte supera la coordenada',
  sch.properToTen > 10 - sch.rPlus,
  `${sch.properToTen.toFixed(2)} M > ${(10 - sch.rPlus).toFixed(2)} M`,
)
record('el horizonte de Schwarzschild sí se puede sumergir', sch.horizonFails === false)

// --- Espin alto: el horizonte deja de ser sumergible ---------------------
const kerr = await measure({ spin: 0.95, charge: 0 }, 'Kerr a=0.95', 'tools/out/mesh-kerr.png')
record(
  'con a/M = 0.95 el horizonte NO admite inmersión euclídea (Smarr)',
  kerr.horizonFails === true,
)
record('la malla sigue dibujándose con espín alto', kerr.drawnFraction > 0.02)

// --- Carga: contrae el horizonte ----------------------------------------
const rn = await measure({ spin: 0, charge: 0.9 }, 'Reissner-Nordström q=0.9', 'tools/out/mesh-rn.png')
record(
  'la carga contrae el horizonte',
  rn.rPlus < sch.rPlus,
  `r₊ = ${rn.rPlus.toFixed(3)} < ${sch.rPlus.toFixed(3)}`,
)

// --- Sin coloreo por lapso: la forma sola ------------------------------
const noLapse = await measure(
  { spin: 0, charge: 0, meshShowLapse: false },
  'sin coloreo por lapso',
  'tools/out/mesh-nolapse.png',
)
record(
  'sin coloreo, el contraste centro/borde desaparece',
  Math.abs(noLapse.lumInner - noLapse.lumOuter) < Math.abs(sch.lumInner - sch.lumOuter),
  `Δ ${Math.abs(noLapse.lumInner - noLapse.lumOuter).toFixed(1)} frente a ${Math.abs(sch.lumInner - sch.lumOuter).toFixed(1)}`,
)

// --- Superficie del horizonte activada ---------------------------------
const withHorizon = await measure(
  { spin: 0.95, charge: 0, meshShowHorizon: true },
  'con la superficie del horizonte',
  'tools/out/mesh-horizon.png',
)
record(
  'dibujar el horizonte añade geometría',
  withHorizon.drawnFraction > kerr.drawnFraction,
  `${(withHorizon.drawnFraction * 100).toFixed(2)} % > ${(kerr.drawnFraction * 100).toFixed(2)} %`,
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
