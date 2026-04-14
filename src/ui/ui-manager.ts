import type { Character } from "../game/character.ts"

export class UIManager {
  private selectedType = 0
  private onStartCallback: (() => void) | null = null

  constructor() {
    this.bindFullscreen()
    this.bindCharacterSelect()
    this.bindStart()
  }

  setStartCallback(cb: () => void) {
    this.onStartCallback = cb
  }

  private bindFullscreen() {
    const btn = document.getElementById("btn-fs")
    if (!btn) return
    btn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
        ;(screen as { orientation?: { lock: (m: string) => Promise<void> } }).orientation?.lock("landscape").catch(() => {})
      } else {
        document.exitFullscreen()
      }
    })
  }

  private bindCharacterSelect() {
    document.querySelectorAll(".char-card").forEach((c) => {
      c.addEventListener("click", () => {
        document
          .querySelectorAll(".char-card")
          .forEach((x) => x.classList.remove("active"))
        c.classList.add("active")
        this.selectedType = parseInt((c as HTMLElement).dataset.type || "0")
      })
    })
  }

  private bindStart() {
    const startBtn = document.getElementById("start-btn")
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        if (this.onStartCallback) this.onStartCallback()
      })
    }
  }

  getSelectedType() {
    return this.selectedType
  }

  showMenu() {
    const startScreen = document.getElementById("start-screen")
    const overlay = document.getElementById("overlay")
    const uiLayer = document.getElementById("ui-layer")
    if (startScreen) startScreen.style.display = "flex"
    if (overlay) overlay.style.display = "none"
    if (uiLayer) uiLayer.style.display = "none"
  }

  startGame(p1Name: string) {
    const startScreen = document.getElementById("start-screen")
    const overlay = document.getElementById("overlay")
    const uiLayer = document.getElementById("ui-layer")
    const p1NameEl = document.getElementById("p1-name")
    if (startScreen) startScreen.style.display = "none"
    if (overlay) overlay.style.display = "none"
    if (uiLayer) uiLayer.style.display = "block"
    if (p1NameEl) p1NameEl.innerText = p1Name
  }

  updateHUD(p1: Character, p2: Character) {
    const hpPlayer = document.getElementById("hp-player")
    const hpEnemy = document.getElementById("hp-enemy")
    if (hpPlayer) hpPlayer.style.width = `${Math.max(0, p1.hp)}%`
    if (hpEnemy) hpEnemy.style.width = `${Math.max(0, p2.hp)}%`
  }

  showCombo(combo: number) {
    if (combo <= 1) return
    const el = document.getElementById("combo-txt")
    if (!el) return
    el.innerText = `${combo} 连击!`
    el.style.opacity = "1"
    setTimeout(() => {
      el.style.opacity = "0"
    }, 1500)
  }

  showGameOver(isWin: boolean, onRestart: () => void) {
    const overlay = document.getElementById("overlay")
    const txt = document.getElementById("overlay-txt")
    if (overlay) overlay.style.display = "flex"
    if (txt) txt.innerText = isWin ? "你赢了!" : "击倒"

    const restartBtn = document.getElementById("restart-btn")
    if (restartBtn) {
      const newBtn = restartBtn.cloneNode(true) as HTMLElement
      restartBtn.parentNode?.replaceChild(newBtn, restartBtn)
      newBtn.addEventListener("click", onRestart)
    }
  }
}
