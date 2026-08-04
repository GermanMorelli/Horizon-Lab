/**
 * Verificacion del beaming Doppler y del corrimiento gravitacional en el shader.
 *
 * Mide la asimetria de brillo entre los dos lados del disco en una imagen vista
 * de canto, y comprueba que:
 *   1. hay asimetria (un lado se acerca y el otro se aleja);
 *   2. el lado brillante cambia de lado al invertir el sentido de rotacion;
 *   3. la asimetria crece al acercar el borde interno (velocidad orbital mayor);
 *   4. desaparece al mirar desde el eje de espin (movimiento transversal nulo);
 *   5. el contraste es mayor con un disco FRIO que con uno caliente.
 *
 * El punto 5 es el mas informativo: la radiacion observada de un cuerpo negro con
 * corrimiento g es exactamente un cuerpo negro a g*T, asi que si el pico de Wien
 * queda muy por debajo del visible (disco caliente) la banda visible esta en
 * regimen de Rayleigh-Jeans y el contraste va como g; si el pico entra en el
 * visible (disco frio), la dependencia se vuelve exponencial y el contraste se
 * dispara. El conocido g^4 es el valor BOLOMETRICO, no el de banda visible.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const baseUrl = process.argv[2] ?? 'http://localhost:5199'
const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}capture=1`

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 560, height: 400 } })
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
page.on('console', (m) => {
  if (/GL_INVALID/.test(m.text())) console.log(`[gl] ${m.text()}`)
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

/**
 * Configura la escena, espera convergencia y devuelve el brillo medio del disco
 * en la mitad izquierda y en la derecha, restringido a una banda horizontal
 * centrada en el plano del disco.
 */
async function measure(patch, label, saveAs) {
  const out = await page.evaluate(
    async ({ patch }) => {
      const sim = window.__sim
      sim.store.patch({
        diskEnabled: true,
        // Sin estrellas ni capas: solo el disco contribuye al brillo medido.
        starsEnabled: false,
        milkyWayIntensity: 0,
        showHorizon: false,
        showErgosphere: false,
        showPhotonSphere: false,
        showIsco: false,
        showDragGrid: false,
        showOrbits: false,
        diskTurbulence: false,
        bloomEnabled: false,
        timeWarp: 0,
        autoExposure: true,
        exposure: 1,
        renderScale: 1,
        targetSamples: 6,
        maxIter: 1000,
        tolerance: 1e-5,
        rEscape: 300,
        inclination: Math.PI / 2,
        distanceRg: 60,
        fov: (40 * Math.PI) / 180,
        spin: 0.6,
        charge: 0,
        diskOuter: 18,
        ...patch,
      })

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

      // Banda horizontal centrada: el disco visto de canto la ocupa.
      const y0 = Math.floor(H * 0.42)
      const y1 = Math.ceil(H * 0.58)
      // Se excluye la franja central para no promediar la sombra ni el anillo.
      const skip = Math.floor(W * 0.11)

      let left = 0
      let leftN = 0
      let right = 0
      let rightN = 0
      let peakLeft = 0
      let peakRight = 0
      for (let y = y0; y < y1; y++) {
        for (let x = 0; x < W; x++) {
          if (Math.abs(x - W / 2) < skip) continue
          const i = (y * W + x) * 4
          const l = (px[i] + px[i + 1] + px[i + 2]) / 3
          if (l < 1) continue
          if (x < W / 2) {
            left += l
            leftN++
            if (l > peakLeft) peakLeft = l
          } else {
            right += l
            rightN++
            if (l > peakRight) peakRight = l
          }
        }
      }

      const d = sim.store.getDerived()
      return {
        meanLeft: leftN ? left / leftN : 0,
        meanRight: rightN ? right / rightN : 0,
        peakLeft,
        peakRight,
        pxLeft: leftN,
        pxRight: rightN,
        tempMaxK: d.diskTempMaxK,
        dataUrl: c2.toDataURL('image/png'),
      }
    },
    { patch },
  )

  const asym = (out.meanLeft - out.meanRight) / (out.meanLeft + out.meanRight || 1)
  const ratio = out.meanRight > 0 ? out.meanLeft / out.meanRight : Infinity

  console.log(`\n── ${label} ──`)
  console.log(`   T_max                 ${out.tempMaxK.toExponential(3)} K`)
  console.log(
    `   brillo medio izq/der  ${out.meanLeft.toFixed(2)} / ${out.meanRight.toFixed(2)}   (razón ${ratio.toFixed(3)})`,
  )
  console.log(`   pico izq/der          ${out.peakLeft.toFixed(0)} / ${out.peakRight.toFixed(0)}`)
  console.log(`   asimetría             ${asym >= 0 ? '+' : ''}${asym.toFixed(4)}`)

  if (saveAs) {
    mkdirSync('tools/out', { recursive: true })
    writeFileSync(saveAs, Buffer.from(out.dataUrl.split(',')[1], 'base64'))
    console.log(`   captura               ${saveAs}`)
  }

  return { ...out, asym, ratio }
}

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, ok })
  console.log(`   ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// --- Disco caliente, de canto, corrotante ---------------------------------
const hot = await measure(
  { eddingtonRatio: 0.1, massSolar: 1e7, diskPrograde: true },
  'disco caliente, de canto, corrotante',
  'tools/out/doppler-hot.png',
)
record('hay asimetría de brillo entre los dos lados', Math.abs(hot.asym) > 0.05, `${hot.asym.toFixed(4)}`)

// --- Mismo caso, contrarrotante: el lado brillante cambia de lado ---------
const retro = await measure(
  { eddingtonRatio: 0.1, massSolar: 1e7, diskPrograde: false },
  'disco caliente, de canto, contrarrotante',
)
record(
  'invertir el sentido del disco invierte el lado brillante',
  Math.sign(hot.asym) === -Math.sign(retro.asym),
  `${hot.asym.toFixed(4)} -> ${retro.asym.toFixed(4)}`,
)
record(
  'la magnitud de la asimetría es comparable en ambos sentidos',
  Math.abs(Math.abs(retro.asym) / Math.abs(hot.asym) - 1) < 0.6,
  `${Math.abs(hot.asym).toFixed(4)} vs ${Math.abs(retro.asym).toFixed(4)}`,
)

// --- Visto desde el eje: el movimiento es transversal, no hay Doppler -----
const polar = await measure(
  { eddingtonRatio: 0.1, massSolar: 1e7, inclination: 0.12, diskPrograde: true },
  'disco caliente, visto casi desde el eje',
  'tools/out/doppler-polar.png',
)
record(
  'desde el eje de espin la asimetría izquierda/derecha desaparece',
  Math.abs(polar.asym) < Math.abs(hot.asym) * 0.35,
  `${polar.asym.toFixed(4)} frente a ${hot.asym.toFixed(4)} de canto`,
)

// --- Disco FRIO: el pico de Wien entra en el visible y el contraste sube --
// T ~ M^{-1/4} m^{1/4}: con masa alta y tasa baja se llega a ~6000 K.
const cold = await measure(
  { eddingtonRatio: 3e-9, massSolar: 4e9, diskPrograde: true },
  'disco frío (pico de Wien en el visible), de canto',
  'tools/out/doppler-cold.png',
)
record(
  'el disco frío está en el rango de temperatura buscado (3000-15000 K)',
  cold.tempMaxK > 3000 && cold.tempMaxK < 15000,
  `${cold.tempMaxK.toExponential(2)} K`,
)
record(
  'con disco frío el contraste del beaming es mayor que con disco caliente',
  Math.abs(cold.asym) > Math.abs(hot.asym),
  `${Math.abs(cold.asym).toFixed(4)} > ${Math.abs(hot.asym).toFixed(4)}`,
)

// --- Borde interno mas cerca: velocidad orbital mayor, mas beaming --------
const fastSpin = await measure(
  { eddingtonRatio: 3e-9, massSolar: 4e9, spin: 0.998, diskPrograde: true },
  'disco frío con espín casi extremal (ISCO más cerca)',
)
record(
  'un ISCO más interior aumenta el beaming',
  Math.abs(fastSpin.asym) >= Math.abs(cold.asym) * 0.95,
  `a=0.998: ${Math.abs(fastSpin.asym).toFixed(4)} vs a=0.6: ${Math.abs(cold.asym).toFixed(4)}`,
)

await browser.close()

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} comprobaciones superadas`)
console.log(failed.length ? 'RESULTADO: FALLO' : 'RESULTADO: OK')
process.exit(failed.length ? 1 : 0)
