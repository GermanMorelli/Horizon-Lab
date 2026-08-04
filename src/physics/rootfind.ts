/** Utilidades numericas compartidas (busqueda de raices y minimos en 1D). */

/**
 * Metodo de Brent: raiz de `f` en [a, b], que debe encerrar un cambio de signo.
 * Devuelve NaN si f(a) y f(b) tienen el mismo signo.
 */
export function brentRoot(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-12,
  maxIter = 200,
): number {
  let fa = f(a)
  let fb = f(b)
  if (fa === 0) return a
  if (fb === 0) return b
  if (fa * fb > 0) return NaN

  let c = a
  let fc = fa
  let d = b - a
  let e = d

  for (let iter = 0; iter < maxIter; iter++) {
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b
      b = c
      c = a
      fa = fb
      fb = fc
      fc = fa
    }
    const tol1 = 2 * Number.EPSILON * Math.abs(b) + 0.5 * tol
    const m = 0.5 * (c - b)
    if (Math.abs(m) <= tol1 || fb === 0) return b

    if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
      // Interpolacion (secante o cuadratica inversa).
      let p: number
      let q: number
      const s = fb / fa
      if (a === c) {
        p = 2 * m * s
        q = 1 - s
      } else {
        const qq = fa / fc
        const r = fb / fc
        p = s * (2 * m * qq * (qq - r) - (b - a) * (r - 1))
        q = (qq - 1) * (r - 1) * (s - 1)
      }
      if (p > 0) q = -q
      p = Math.abs(p)
      if (2 * p < Math.min(3 * m * q - Math.abs(tol1 * q), Math.abs(e * q))) {
        e = d
        d = p / q
      } else {
        d = m
        e = d
      }
    } else {
      d = m
      e = d
    }

    a = b
    fa = fb
    b += Math.abs(d) > tol1 ? d : m > 0 ? tol1 : -tol1
    fb = f(b)
    if (fb * fc > 0) {
      c = a
      fc = fa
      e = b - a
      d = e
    }
  }
  return b
}

/**
 * Busca el primer cambio de signo de `f` sobre [lo, hi] muestreando `n` puntos
 * y refina con Brent. Devuelve NaN si no encuentra ninguno.
 * Con `fromHigh` recorre desde `hi` hacia `lo` (util para tomar la raiz exterior).
 */
export function scanRoot(
  f: (x: number) => number,
  lo: number,
  hi: number,
  n = 512,
  fromHigh = false,
  tol = 1e-12,
): number {
  const step = (hi - lo) / n
  const xs: number[] = []
  for (let i = 0; i <= n; i++) xs.push(lo + i * step)
  if (fromHigh) xs.reverse()

  let xPrev = xs[0]
  let fPrev = f(xPrev)
  for (let i = 1; i < xs.length; i++) {
    const x = xs[i]
    const fx = f(x)
    if (Number.isFinite(fPrev) && Number.isFinite(fx) && fPrev * fx <= 0) {
      const [a, b] = xPrev < x ? [xPrev, x] : [x, xPrev]
      return brentRoot(f, a, b, tol)
    }
    xPrev = x
    fPrev = fx
  }
  return NaN
}

/**
 * Seccion dorada: minimo de una funcion unimodal en [a, b].
 * Devuelve la abscisa del minimo.
 */
export function goldenMin(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-10,
  maxIter = 400,
): number {
  const invPhi = (Math.sqrt(5) - 1) / 2
  let x1 = b - invPhi * (b - a)
  let x2 = a + invPhi * (b - a)
  let f1 = f(x1)
  let f2 = f(x2)

  for (let i = 0; i < maxIter && b - a > tol; i++) {
    if (f1 < f2) {
      b = x2
      x2 = x1
      f2 = f1
      x1 = b - invPhi * (b - a)
      f1 = f(x1)
    } else {
      a = x1
      x1 = x2
      f1 = f2
      x2 = a + invPhi * (b - a)
      f2 = f(x2)
    }
  }
  return 0.5 * (a + b)
}
