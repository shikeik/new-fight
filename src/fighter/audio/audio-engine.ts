export function haptic(ms: number) {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms)
}

export class AudioEngine {
  // eslint-disable-next-line no-undef
  private ctx: AudioContext | null = null
  // eslint-disable-next-line no-undef
  private master: GainNode | null = null

  init() {
    if (this.ctx && this.ctx.state === "running") return
    // eslint-disable-next-line no-undef
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.5
    this.master.connect(this.ctx.destination)
  }

  play(
    freq: number,
    // eslint-disable-next-line no-undef
    type: OscillatorType,
    dur: number,
    vol: number,
    slide: number | null = null
  ) {
    if (!this.ctx || this.ctx.state !== "running" || !this.master) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.connect(gain)
    gain.connect(this.master)
    osc.frequency.setValueAtTime(freq, t)
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur)
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur)
    osc.start(t)
    osc.stop(t + dur)
  }

  sfxHitLight() {
    this.play(300, "square", 0.1, 0.4, 100)
    haptic(20)
  }
  sfxHitHeavy() {
    this.play(150, "sawtooth", 0.2, 0.7, 50)
    haptic(50)
  }
  sfxBlock() {
    this.play(800, "sine", 0.1, 0.5, 1200)
    haptic(10)
  }
  sfxSwing() {
    this.play(200, "sine", 0.12, 0.3, 100)
  }
  sfxSlash() {
    this.play(1000, "sawtooth", 0.1, 0.2, 500)
  }
  sfxDash() {
    this.play(120, "sawtooth", 0.15, 0.2, 40)
  }
  sfxShoot() {
    this.play(600, "square", 0.2, 0.4, 150)
  }
  sfxKO() {
    this.play(100, "sawtooth", 1.5, 0.8, 20)
    haptic(200)
  }
}

export const audio = new AudioEngine()

