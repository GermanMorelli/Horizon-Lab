/**
 * Sonificacion del chirp gravitacional.
 *
 * La frecuencia que se reproduce es la frecuencia REAL de la onda gravitacional,
 * no una invencion: para masas estelares cae directamente en el rango audible
 * (GW150914 barrio de ~35 a ~250 Hz), y por eso el chirp de LIGO se puede
 * escuchar sin transponer nada.
 *
 * Para masas supermasivas la frecuencia es de nanohercios y queda muchisimo por
 * debajo del oido; en ese caso se transpone por octavas hasta el rango audible y
 * se indica el factor, en lugar de reproducir un silencio o mentir sobre la
 * frecuencia.
 */

const AUDIBLE_MIN = 40
const AUDIBLE_MAX = 1200

export interface ChirpState {
  /** Frecuencia real de la onda gravitacional, en Hz. */
  realHz: number
  /** Frecuencia reproducida, tras transponer por octavas. */
  playedHz: number
  /** Numero de octavas de transposicion (0 = sin transponer). */
  octaveShift: number
}

export class ChirpAudio {
  private ctx: AudioContext | null = null
  private osc: OscillatorNode | null = null
  private gain: GainNode | null = null
  private running = false
  private last: ChirpState = { realHz: 0, playedHz: 0, octaveShift: 0 }

  get state(): Readonly<ChirpState> {
    return this.last
  }

  get isRunning(): boolean {
    return this.running
  }

  /**
   * Transpone por octavas hasta el rango audible.
   * Se usan octavas (potencias de 2) y no un factor arbitrario para que la
   * relacion entre frecuencias se conserve y el chirp suene como el original.
   */
  static toAudible(realHz: number): { playedHz: number; octaveShift: number } {
    if (!(realHz > 0)) return { playedHz: 0, octaveShift: 0 }
    let shift = 0
    let f = realHz
    while (f < AUDIBLE_MIN && shift < 80) {
      f *= 2
      shift++
    }
    while (f > AUDIBLE_MAX && shift > -80) {
      f /= 2
      shift--
    }
    return { playedHz: f, octaveShift: shift }
  }

  /** Arranca el oscilador. Debe llamarse desde un gesto del usuario. */
  async start(): Promise<void> {
    if (this.running) return
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) throw new Error('Este navegador no soporta AudioContext')
      this.ctx = new Ctor()
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume()

    this.osc = this.ctx.createOscillator()
    this.osc.type = 'sine'
    this.gain = this.ctx.createGain()
    // Arranque suave: un salto de ganancia produce un chasquido.
    this.gain.gain.setValueAtTime(0, this.ctx.currentTime)
    this.gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.05)
    this.osc.connect(this.gain).connect(this.ctx.destination)
    this.osc.frequency.setValueAtTime(Math.max(this.last.playedHz, AUDIBLE_MIN), this.ctx.currentTime)
    this.osc.start()
    this.running = true
  }

  stop(): void {
    if (!this.running || !this.ctx || !this.osc || !this.gain) return
    const t = this.ctx.currentTime
    this.gain.gain.cancelScheduledValues(t)
    this.gain.gain.setValueAtTime(this.gain.gain.value, t)
    this.gain.gain.linearRampToValueAtTime(0, t + 0.08)
    this.osc.stop(t + 0.1)
    this.osc = null
    this.gain = null
    this.running = false
  }

  /**
   * Actualiza la frecuencia. La amplitud crece con la frecuencia igual que la
   * amplitud real de la onda (h ~ f^{2/3}), acotada para no saturar.
   */
  update(realHz: number): ChirpState {
    const { playedHz, octaveShift } = ChirpAudio.toAudible(realHz)
    this.last = { realHz, playedHz, octaveShift }
    if (this.running && this.ctx && this.osc && this.gain && playedHz > 0) {
      const t = this.ctx.currentTime
      // Rampa corta en lugar de salto: evita clicks al cambiar la frecuencia.
      this.osc.frequency.linearRampToValueAtTime(playedHz, t + 0.03)
      const amp = 0.05 + 0.1 * Math.min(1, Math.pow(playedHz / AUDIBLE_MAX, 2 / 3))
      this.gain.gain.linearRampToValueAtTime(amp, t + 0.03)
    }
    return this.last
  }

  dispose(): void {
    this.stop()
    this.ctx?.close()
    this.ctx = null
  }
}
