/**
 * Avisos fisicos y numericos.
 *
 * Se declaran explicitamente en la interfaz los regimenes donde el resultado
 * deja de ser lo que el usuario podria suponer: singularidad desnuda, perdida de
 * precision cerca del caso extremo, camara dentro de la ergosfera, y falta de
 * presupuesto de iteraciones.
 */

import type { Derived, ParamStore, SimParams } from '../state/params'
import { el } from './widgets'

type Level = 'danger' | 'warn' | 'info'

interface WarnDef {
  id: string
  level: Level
  icon: string
  html: string
}

export class Warnings {
  private transient = new Map<string, { def: WarnDef; until: number }>()

  constructor(
    private root: HTMLElement,
    private store: ParamStore,
  ) {
    store.subscribe(() => this.render())
  }

  /** Muestra un aviso temporal (presets, capturas, avisos de contexto). */
  flash(id: string, level: Level, html: string, ms = 9000, icon = 'ℹ'): void {
    this.transient.set(id, { def: { id, level, icon, html }, until: Date.now() + ms })
    this.render()
    window.setTimeout(() => {
      const t = this.transient.get(id)
      if (t && Date.now() >= t.until) {
        this.transient.delete(id)
        this.render()
      }
    }, ms + 50)
  }

  /** Avisos derivados del estado actual. */
  private compute(p: SimParams, d: Derived): WarnDef[] {
    const out: WarnDef[] = []

    if (!d.hasHorizon) {
      out.push({
        id: 'naked',
        level: 'danger',
        icon: '⚠',
        html:
          `<b>Singularidad desnuda</b> — <code>a² + q² = ${d.extremality.toFixed(3)} > 1</code>. ` +
          'Sin horizonte de sucesos y por tanto sin sombra. Es una solución exacta de ' +
          'Einstein-Maxwell, pero viola la censura cósmica: no se espera que exista. Los rayos ' +
          'se terminan cerca de la singularidad en anillo, que es una elección de renderizado, ' +
          'no física.',
      })
    } else if (d.extremality > 0.995) {
      out.push({
        id: 'extremal',
        level: 'warn',
        icon: '⚠',
        html:
          `<b>Régimen casi extremal</b> — <code>a² + q² = ${d.extremality.toFixed(4)}</code>. ` +
          'Los dos horizontes casi coinciden y la precisión de coma flotante de 32 bits del ' +
          'shader se degrada junto a <code>r₊</code>. Los observables del HUD (calculados en ' +
          'doble precisión) siguen siendo fiables.',
      })
    }

    if (d.hasHorizon && d.camDistanceRg < d.rErgoEquator * 1.05) {
      out.push({
        id: 'ergo',
        level: 'info',
        icon: '◉',
        html:
          '<b>Cámara dentro de la ergosfera</b> — aquí no existe ningún observador estático: ' +
          'el arrastre de marcos obliga a co-rotar. La cámara es un <b>ZAMO</b>, que sí existe, ' +
          'y por eso la imagen sigue siendo consistente.',
      })
    }

    if (p.charge > 0.01) {
      out.push({
        id: 'charge',
        level: 'info',
        icon: 'ℹ',
        html:
          `<b>Carga no astrofísica</b> — <code>Q/M = ${p.charge.toFixed(3)}</code>. Los agujeros ` +
          'negros reales se descargan hasta <code>Q/M ~ 10⁻¹⁸</code> por el plasma circundante. ' +
          'La geometría es exacta; el escenario no es observable.',
      })
    }

    if (p.markNonConverged) {
      out.push({
        id: 'diag',
        level: 'info',
        icon: '⬤',
        html:
          '<b>Modo diagnóstico</b> — los píxeles magenta son rayos que agotaron el presupuesto ' +
          'de iteraciones sin caer ni escapar. Si aparecen alrededor del anillo de fotones, sube ' +
          '«Iteraciones por rayo».',
      })
    }

    if (!p.autoExposure) {
      out.push({
        id: 'autoexp',
        level: 'info',
        icon: '◐',
        html:
          '<b>Exposición física</b> — sin compensación automática. El brillo superficial visible ' +
          'de un cuerpo negro crece aproximadamente <code>∝ T</code> en la banda visible, así que ' +
          'al bajar la masa (<code>T ∝ M^−1/4</code>) el disco se ve genuinamente más brillante.',
      })
    }

    return out
  }

  private render(): void {
    const p = this.store.get()
    const d = this.store.getDerived()
    const now = Date.now()

    const defs = [
      ...[...this.transient.values()].filter((t) => t.until > now).map((t) => t.def),
      ...this.compute(p, d),
    ]

    this.root.replaceChildren()
    for (const def of defs) {
      const n = el('div', `warning ${def.level}`)
      n.appendChild(el('span', 'icon', def.icon))
      const body = el('span')
      body.innerHTML = def.html
      n.appendChild(body)
      this.root.appendChild(n)
    }
  }
}
