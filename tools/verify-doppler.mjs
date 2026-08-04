/**
 * Verificacion del beaming Doppler y del corrimiento gravitacional en el shader.
 *
 * ---------------------------------------------------------------------------
 * Por que se mide en el BUFFER DE ACUMULACION y no en el canvas
 * ---------------------------------------------------------------------------
 * El canvas contiene la imagen ya pasada por ACES y codificada a sRGB, y ACES
 * comprime fuertemente el rango alto: un contraste fisico de 1.7x entre los dos
 * lados del disco se aplasta a un ~2 % de diferencia en los bytes de salida, con
 * ambos lados cerca de la saturacion. Medir ahi no distingue "hay poco beaming"
 * de "hay beaming y el tonemap lo esconde".
 *
 * El buffer de acumulacion, en cambio, guarda RADIANCIA LINEAL en coma flotante,
 * que es la magnitud fisica. Ahi el contraste se lee directamente.
 *
 * Comprobaciones:
 *   1. hay asimetria de radiancia entre los dos lados (uno se acerca, otro se aleja);
 *   2. el lado brillante cambia de lado al invertir el sentido de rotacion;
 *   3. la asimetria casi desaparece mirando desde el eje de espin (movimiento
 *      transversal a la linea de vision);
 *   4. el contraste crece con un disco FRIO.
 *
 * El punto 4 es el mas informativo. La radiacion observada de un cuerpo negro con
 * corrimiento g es exactamente un cuerpo negro a g*T. Si el pico de Wien queda muy
 * por debajo del visible (disco caliente), la banda visible esta en regimen de
 * Rayleigh-Jeans y el contraste va como g; si el pico entra en el visible (disco
 * frio), la dependencia se vuelve exponencial y el contraste se dispara. El
 * conocido g^4 es el valor BOLOMETRICO, no el de banda visible.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const baseUrl = process.argv[2] ?? 'http://localhost:5173'
const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}capture=1`

/** Ver la nota equivalente en verify-shadow.mjs. */
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
const page = await browser.newPage({ viewport: { width: 520, height: 380 } })
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
page.on('console', (m) => {
  if (/GL_INVALID/.test(m.text())) console.log(`[gl] ${m.text()}`)
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

/**
 * Configura la escena, espera convergencia y mide la radiancia lineal media del
 * disco en la mitad izquierda y en la derecha del buffer de acumulacion.
 */
async function measure(patch, label, saveAs) {
  const out = await page.evaluate(
    async ({ patch }) => {
      const sim = window.__sim
      sim.store.patch({
        diskEnabled: true,
        // Solo el disco debe contribuir a la radiancia medida.
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
        autoQuality: false, // la medida debe ser reproducible
        exposure: 1,
        renderScale: 1,
        targetSamples: 4,
        maxIter: 900,
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

      // --- Lectura de radiancia lineal del acumulador ----------------------
      const r = sim.renderer
      const gl = r.gl
      const latest = r.latest
      if (!latest) return { error: 'sin buffer de acumulacion' }

      const W = latest.width
      const H = latest.height
      const buf = new Float32Array(W * H * 4)
      gl.bindFramebuffer(gl.FRAMEBUFFER, latest.fbo)
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.FLOAT, buf)
      const glErr = gl.getError()
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      // Luminancia Rec.709 de la radiancia lineal.
      const lum = (i) => 0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2]

      // Banda horizontal centrada (el disco de canto la ocupa) excluyendo la
      // franja central, donde estan la sombra y el anillo de fotones.
      const y0 = Math.floor(H * 0.4)
      const y1 = Math.ceil(H * 0.6)
      const skip = Math.floor(W * 0.13)
      const FLOOR = 1e-4 // ignora pixeles sin disco

      const valsL = []
      const valsR = []
      for (let y = y0; y < y1; y++) {
        for (let x = 0; x < W; x++) {
          if (Math.abs(x - W / 2) < skip) continue
          const v = lum((y * W + x) * 4)
          if (!(v > FLOOR)) continue
          if (x < W / 2) valsL.push(v)
          else valsR.push(v)
        }
      }

      /**
       * Percentil 98 de cada lado: es la metrica primaria.
       *
       * Comparar MEDIAS no vale aqui: la banda de medicion cubre areas de disco
       * muy distintas a cada lado (el arrastre de marcos desplaza la sombra y las
       * caras cercana y lejana se proyectan de forma diferente), asi que una media
       * mezcla "cuanto disco hay" con "cuanto brilla". El percentil alto compara
       * el punto mas brillante de cada lado, que es donde el beaming es maximo, y
       * es insensible al area. Se usa percentil y no el maximo absoluto para que un
       * unico pixel atipico no decida el resultado.
       */
      const pct = (arr, f) => {
        if (arr.length === 0) return 0
        const s = [...arr].sort((a, b) => a - b)
        return s[Math.min(s.length - 1, Math.floor(f * s.length))]
      }
      const nL = valsL.length
      const nR = valsR.length
      const sumL = valsL.reduce((a, b) => a + b, 0)
      const sumR = valsR.reduce((a, b) => a + b, 0)
      const peakL = pct(valsL, 0.98)
      const peakR = pct(valsR, 0.98)

      const d = sim.store.getDerived()
      const c2 = document.createElement('canvas')
      c2.width = document.getElementById('view').width
      c2.height = document.getElementById('view').height
      c2.getContext('2d').drawImage(document.getElementById('view'), 0, 0)

      return {
        glErr,
        meanL: nL ? sumL / nL : 0,
        meanR: nR ? sumR / nR : 0,
        peakL,
        peakR,
        nL,
        nR,
        tempMaxK: d.diskTempMaxK,
        rIsco: d.rDiskInner,
        dataUrl: c2.toDataURL('image/png'),
      }
    },
    { patch },
  )

  if (out.error) {
    console.log(`\n── ${label} ──  ERROR: ${out.error}`)
    return out
  }

  // Contraste de radiancia lineal. El percentil 98 es la metrica primaria; la
  // media se reporta como referencia pero esta sesgada por el area (ver arriba).
  const meanRatio = out.meanR > 0 ? out.meanL / out.meanR : Infinity
  const peakRatio = out.peakR > 0 ? out.peakL / out.peakR : Infinity
  const asym = (out.peakL - out.peakR) / (out.peakL + out.peakR || 1)
  /** Contraste, siempre >= 1, sin importar que lado sea el brillante. */
  const contrast = Math.max(peakRatio, 1 / peakRatio)

  console.log(`\n── ${label} ──`)
  console.log(`   T_max                 ${out.tempMaxK.toExponential(3)} K   r_in ${out.rIsco.toFixed(2)} M`)
  console.log(
    `   percentil 98 i/d      ${out.peakL.toExponential(3)} / ${out.peakR.toExponential(3)}   (razón ${peakRatio.toFixed(3)})`,
  )
  console.log(`   asimetría (p98)       ${asym >= 0 ? '+' : ''}${asym.toFixed(4)}   contraste ${contrast.toFixed(3)}×`)
  console.log(
    `   media i/d             ${out.meanL.toExponential(3)} / ${out.meanR.toExponential(3)}` +
      `   (razón ${meanRatio.toFixed(3)}, sesgada: ${out.nL} vs ${out.nR} px)`,
  )

  if (saveAs) {
    mkdirSync('tools/out', { recursive: true })
    writeFileSync(saveAs, Buffer.from(out.dataUrl.split(',')[1], 'base64'))
    console.log(`   captura               ${saveAs}`)
  }

  return { ...out, asym, meanRatio, peakRatio, contrast }
}

const checks = []
const record = (name, ok, detail) => {
  checks.push({ name, ok })
  console.log(`   ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// ---------------------------------------------------------------------------
// Disco caliente (Rayleigh-Jeans en el visible): el contraste va como g
// ---------------------------------------------------------------------------
const hot = await measure(
  { eddingtonRatio: 0.1, massSolar: 1e7, diskPrograde: true },
  'disco caliente, de canto, corrotante',
  'tools/out/doppler-hot.png',
)
record(
  'hay asimetría de radiancia entre los dos lados',
  Math.abs(hot.asym) > 0.05,
  `asimetría ${hot.asym.toFixed(4)}, contraste ${hot.contrast.toFixed(3)}×`,
)
record(
  'el contraste está en el rango que predice el régimen ~g (1.1x - 4x)',
  hot.contrast > 1.1 && hot.contrast < 4,
  `${hot.contrast.toFixed(3)}×`,
)

// --- Invertir el sentido del disco invierte el lado brillante --------------
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
  'la asimetría contrarrotante también es significativa',
  Math.abs(retro.asym) > 0.05,
  `${retro.asym.toFixed(4)}, contraste ${retro.contrast.toFixed(3)}×`,
)
// NO se exige igual magnitud: con el espín fijo, un disco corrotante y otro
// contrarrotante tienen ISCOs distintos (r_in prógrado es mucho más interior), así
// que son configuraciones físicamente distintas, con velocidades orbitales y
// extensiones diferentes.
console.log(
  `   · r_in corrotante ${hot.rIsco.toFixed(2)} M vs contrarrotante ${retro.rIsco.toFixed(2)} M` +
    ' (por eso las magnitudes no tienen por qué coincidir)',
)

// --- Desde el eje de espin el movimiento es transversal: no hay Doppler ----
const polar = await measure(
  { eddingtonRatio: 0.1, massSolar: 1e7, inclination: 0.06, diskPrograde: true },
  'disco caliente, visto casi desde el eje',
  'tools/out/doppler-polar.png',
)
record(
  'desde el eje de espín la asimetría izquierda/derecha casi desaparece',
  Math.abs(polar.asym) < Math.abs(hot.asym) * 0.25,
  `${polar.asym.toFixed(4)} frente a ${hot.asym.toFixed(4)} de canto`,
)

// ---------------------------------------------------------------------------
// Disco frio: el pico de Wien entra en el visible y el contraste se dispara
// ---------------------------------------------------------------------------
// T = 1e7 (M/10)^{-1/4} (edd/0.1)^{1/4}. Con M = 4e9 y edd = 5e-6 sale ~6000 K,
// que pone el pico de Wien en ~480 nm, dentro de la banda visible.
const cold = await measure(
  { eddingtonRatio: 5e-6, massSolar: 4e9, diskPrograde: true },
  'disco frío (pico de Wien en el visible), de canto',
  'tools/out/doppler-cold.png',
)
record(
  'el disco frío está en el rango de temperatura buscado (3000-15000 K)',
  cold.tempMaxK > 3000 && cold.tempMaxK < 15000,
  `${cold.tempMaxK.toExponential(3)} K`,
)
record(
  'con disco frío el contraste del beaming es mucho mayor que con disco caliente',
  cold.contrast > hot.contrast * 1.5,
  `frío ${cold.contrast.toFixed(2)}× vs caliente ${hot.contrast.toFixed(2)}×`,
)
record(
  'el lado brillante es el mismo con disco frío que con disco caliente',
  Math.sign(cold.asym) === Math.sign(hot.asym),
  `${hot.asym.toFixed(4)} y ${cold.asym.toFixed(4)}`,
)

await browser.close()

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} comprobaciones superadas`)
console.log(failed.length ? 'RESULTADO: FALLO' : 'RESULTADO: OK')
process.exit(failed.length ? 1 : 0)
