import type { InputState } from "@/fighter/types/game.ts"

export class InputManager {
  state: InputState = { x: 0, a: false, b: false, c: false, s: false, d: false }

  constructor() {
    this.bindButtons()
    this.bindKeyboard()
    this.bindJoystick()
  }

  private bindButtons() {
    const bindBtn = (id: string, key: keyof InputState) => {
      const el = document.getElementById(id)
      if (!el) return
      el.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault()
          ;(this.state as unknown as Record<string, boolean>)[key] = true
        },
        { passive: false }
      )
      el.addEventListener(
        "touchend",
        (e) => {
          e.preventDefault()
          ;(this.state as unknown as Record<string, boolean>)[key] = false
        },
        { passive: false }
      )
      el.addEventListener("mousedown", (e) => {
        e.preventDefault()
        ;(this.state as unknown as Record<string, boolean>)[key] = true
      })
      el.addEventListener("mouseup", (e) => {
        e.preventDefault()
        ;(this.state as unknown as Record<string, boolean>)[key] = false
      })
      el.addEventListener("contextmenu", (e) => e.preventDefault())
    }
    bindBtn("btn-a", "a")
    bindBtn("btn-b", "b")
    bindBtn("btn-c", "c")
    bindBtn("btn-s", "s")
    bindBtn("btn-d", "d")
  }

  private bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.state.x = -1
      if (e.code === "ArrowRight" || e.code === "KeyD") this.state.x = 1
      if (e.code === "KeyJ") this.state.a = true
      if (e.code === "KeyK") this.state.b = true
      if (e.code === "KeyL") this.state.c = true
      if (e.code === "KeyI") this.state.s = true
      if (e.code === "KeyS" || e.code === "ShiftLeft") this.state.d = true
    })
    window.addEventListener("keyup", (e) => {
      if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(e.code))
        this.state.x = 0
      if (e.code === "KeyJ") this.state.a = false
      if (e.code === "KeyK") this.state.b = false
      if (e.code === "KeyL") this.state.c = false
      if (e.code === "KeyI") this.state.s = false
      if (e.code === "KeyS" || e.code === "ShiftLeft") this.state.d = false
    })
  }

  private bindJoystick() {
    const track = document.getElementById("slider-track")
    const knob = document.getElementById("slider-knob")
    if (!track || !knob) return
    let jAct = false
    const updateJoy = (cx: number) => {
      const rect = track.getBoundingClientRect()
      const max = rect.width / 2 - 30
      let dx = cx - (rect.left + rect.width / 2)
      dx = Math.max(-max, Math.min(max, dx))
      knob.style.transform = `translate(${dx}px, 0)`
      this.state.x = dx > 15 ? 1 : dx < -15 ? -1 : 0
    }
    track.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
        jAct = true
        updateJoy(e.touches[0].clientX)
      },
      { passive: false }
    )
    track.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()
        if (jAct) updateJoy(e.touches[0].clientX)
      },
      { passive: false }
    )
    track.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault()
        jAct = false
        knob.style.transform = "translate(0,0)"
        this.state.x = 0
      },
      { passive: false }
    )
  }
}

