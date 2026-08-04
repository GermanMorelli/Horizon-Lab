/** Fabrica de controles minima, sin dependencias. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag)
  if (className) n.className = className
  if (text !== undefined) n.textContent = text
  return n
}

export interface SliderOptions {
  label: string
  /** Simbolo matematico mostrado junto a la etiqueta (ej. 'a/M'). */
  symbol?: string
  min: number
  max: number
  step?: number
  value: number
  /** Escala logaritmica: min y max deben ser > 0. */
  log?: boolean
  format: (v: number) => string
  onInput: (v: number) => void
}

export interface SliderHandle {
  root: HTMLElement
  set(v: number): void
}

/**
 * Slider con lectura numerica. En modo logaritmico el control se mueve en
 * log10 del valor, que es lo unico usable para la masa (10 decadas).
 */
export function slider(o: SliderOptions): SliderHandle {
  const root = el('div', 'ctl')
  const labelRow = el('div', 'ctl-label')
  const name = el('span', 'name')
  name.appendChild(el('span', undefined, o.label))
  if (o.symbol) name.appendChild(el('span', 'sym', o.symbol))
  const val = el('span', 'ctl-value')
  labelRow.append(name, val)

  const input = el('input')
  input.type = 'range'

  const toSlider = (v: number) => (o.log ? Math.log10(v) : v)
  const fromSlider = (s: number) => (o.log ? Math.pow(10, s) : s)

  input.min = String(toSlider(o.min))
  input.max = String(toSlider(o.max))
  input.step = String(o.log ? (Math.log10(o.max) - Math.log10(o.min)) / 1000 : (o.step ?? 0.001))

  const paint = (v: number) => {
    val.textContent = o.format(v)
    const s = toSlider(v)
    const lo = Number(input.min)
    const hi = Number(input.max)
    const pct = hi > lo ? ((s - lo) / (hi - lo)) * 100 : 0
    input.style.setProperty('--fill', `${pct}%`)
  }

  input.value = String(toSlider(o.value))
  paint(o.value)

  input.addEventListener('input', () => {
    const v = fromSlider(Number(input.value))
    paint(v)
    o.onInput(v)
  })

  root.append(labelRow, input)

  return {
    root,
    set(v: number) {
      input.value = String(toSlider(v))
      paint(v)
    },
  }
}

export interface ToggleHandle {
  root: HTMLElement
  set(v: boolean): void
}

export function toggle(
  label: string,
  value: boolean,
  onChange: (v: boolean) => void,
): ToggleHandle {
  const root = el('label', 'toggle')
  const span = el('span', undefined, label)
  const input = el('input')
  input.type = 'checkbox'
  input.checked = value
  const sw = el('span', 'sw')
  root.append(span, input, sw)
  input.addEventListener('change', () => onChange(input.checked))
  return {
    root,
    set(v: boolean) {
      input.checked = v
    },
  }
}

export interface SegmentedHandle<T extends string> {
  root: HTMLElement
  set(v: T): void
}

export function segmented<T extends string>(
  options: Array<{ value: T; label: string; title?: string }>,
  value: T,
  onChange: (v: T) => void,
): SegmentedHandle<T> {
  const root = el('div', 'segmented')
  const buttons = new Map<T, HTMLButtonElement>()
  for (const o of options) {
    const b = el('button', undefined, o.label)
    if (o.title) b.title = o.title
    if (o.value === value) b.classList.add('active')
    b.addEventListener('click', () => {
      for (const [, other] of buttons) other.classList.remove('active')
      b.classList.add('active')
      onChange(o.value)
    })
    buttons.set(o.value, b)
    root.appendChild(b)
  }
  return {
    root,
    set(v: T) {
      for (const [k, b] of buttons) b.classList.toggle('active', k === v)
    },
  }
}

export interface SectionHandle {
  root: HTMLElement
  body: HTMLElement
}

export function section(title: string, open = true): SectionHandle {
  const root = el('div', `section${open ? '' : ' closed'}`)
  const head = el('button', 'section-head')
  head.appendChild(el('span', 'chev', '▾'))
  head.appendChild(el('span', undefined, title))
  const body = el('div', 'section-body')
  head.addEventListener('click', () => root.classList.toggle('closed'))
  root.append(head, body)
  return { root, body }
}

export function note(html: string): HTMLElement {
  const n = el('div', 'note')
  n.innerHTML = html
  return n
}

export function button(label: string, onClick: () => void, title?: string): HTMLButtonElement {
  const b = el('button', 'btn', label)
  if (title) b.title = title
  b.addEventListener('click', onClick)
  return b
}

/** Fila de lectura del HUD. */
export function hudRow(
  symbol: string,
  desc: string,
  title?: string,
): { root: HTMLElement; set(v: string, dim?: boolean): void } {
  const root = el('div', 'hud-row')
  const k = el('div', 'k')
  k.appendChild(el('span', 'sym', symbol))
  k.appendChild(el('span', 'desc', desc))
  if (title) root.title = title
  const v = el('div', 'v', '—')
  root.append(k, v)
  return {
    root,
    set(text: string, dim = false) {
      v.textContent = text
      v.classList.toggle('dim', dim)
    },
  }
}

/** Grupo del HUD: un contenedor con titulo al que se le anaden filas. */
export function hudGroup(title: string): HTMLElement {
  const root = el('div', 'hud-group')
  root.appendChild(el('div', 'hud-group-title', title))
  return root
}

// ---------------------------------------------------------------------------
// Formateo numerico
// ---------------------------------------------------------------------------

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function sup(n: number): string {
  return String(n)
    .split('')
    .map((c) => (c === '-' ? '⁻' : SUP[Number(c)] ?? c))
    .join('')
}

/** Notacion cientifica compacta para el HUD. */
export function sci(v: number, digits = 3): string {
  if (!Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e-3 && abs < 1e5) return v.toPrecision(digits)
  const e = Math.floor(Math.log10(abs))
  const m = v / Math.pow(10, e)
  return `${m.toFixed(digits - 1)}×10${sup(e)}`
}

/** Numero fijo, con em-dash si no es finito. */
export function num(v: number, digits = 3): string {
  return Number.isFinite(v) ? v.toFixed(digits) : '—'
}
