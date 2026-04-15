import * as THREE from "three"
import mountIndexedDB from "@shikeik/eruda-indexeddb"

import { normalizeResult, makeSuccessResult, makeErrorResult } from "@/shared/lib/eval-engine.ts"
import { modTick } from "@/shared/infra/mod-tick.ts"
import { logs } from "@/shared/infra/log-capture.ts"
import { audio } from "./audio/audio-engine.ts"
import { VFXEngine } from "./render/vfx-engine.ts"
import { buildEnvironment } from "./render/environment.ts"
import { updateCamera, updateMenuCamera } from "./render/camera.ts"
import { InputManager } from "./input/input-handler.ts"
import { UIManager } from "./ui/ui-manager.ts"
import { Character } from "./game/character.ts"
import { AIController } from "./game/ai-controller.ts"
import { processPlayerLogic } from "./game/player-logic.ts"
import { ProjectileSystem } from "./game/projectiles.ts"
import { CHARACTER_NAMES, CFG } from "./config/game-config.ts"
import type { AppState } from "./types/game.ts"

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer
let vfx: VFXEngine
let p1: Character, p2: Character
const aiLogic = new AIController()
let lastT = performance.now()
let appState: AppState = "MENU"
let inputManager: InputManager
let uiManager: UIManager
const projectiles = new ProjectileSystem()

// ===== Unified Game Context for eval-api =====
const gameContext = {
  get scene() { return scene },
  get camera() { return camera },
  get renderer() { return renderer },
  get vfx() { return vfx },
  get p1() { return p1 },
  get p2() { return p2 },
  get projectiles() { return projectiles },
  get inputManager() { return inputManager },
  get uiManager() { return uiManager },
  get aiLogic() { return aiLogic },
  get audio() { return audio },
  get CFG() { return CFG },
  get appState() { return appState },
  get sysProjectiles() { return projectiles.items },
  gameHitStop: 0,
  gameCamShake: 0,
  slowMoTimer: 0,
}

if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).modTick = modTick
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).logs = logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__GAME__ = gameContext
}

// ===== HMR Eval Bridge (auto-injects __GAME__ keys) =====
const hot = import.meta.hot
if (hot) {
  function evalWithGameContext(code: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).__GAME__ as Record<string, unknown>
    const keys = Object.keys(g)
    const fn = new Function(
      ...keys,
      "__code__",
      "return eval(__code__)"
    )
    return fn(...keys.map((k) => g[k]), code)
  }

  hot.on("api-eval-request", async (data) => {
    let res
    try {
      let raw = evalWithGameContext(data.code)
      if (raw && typeof raw === "object" && typeof (raw as { then?: unknown }).then === "function") {
        raw = await (raw as Promise<unknown>)
      }
      res = makeSuccessResult(normalizeResult(raw))
    } catch (e) {
      res = makeErrorResult(e)
    }
    hot.send("api-eval-response", {
      id: data.id,
      ...res,
    })
  })
}

// ===== Inject IndexedDB into eruda Resources =====
// eslint-disable-next-line no-undef
if (typeof eruda !== "undefined" && eruda.get) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
  mountIndexedDB(eruda as any)
}

async function init() {
  const canvasBox = document.getElementById("canvas-container")
  if (!canvasBox) return

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  canvasBox.appendChild(renderer.domElement)
  // WebGLRenderer does not require init()

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  )
  vfx = new VFXEngine(scene)
  buildEnvironment(scene)

  inputManager = new InputManager()
  uiManager = new UIManager()
  uiManager.setStartCallback(startGameFlow)

  window.addEventListener("resize", () => {
    if (!camera || !renderer) return
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  requestAnimationFrame(mainLoop)
}

function startGameFlow() {
  audio.init()
  const selType = uiManager.getSelectedType()
  uiManager.startGame(CHARACTER_NAMES[selType])

  if (p1) scene.remove(p1.root)
  if (p2) scene.remove(p2.root)
  projectiles.clear(scene)

  p1 = new Character(true, selType)
  scene.add(p1.root)
  p2 = new Character(false, Math.floor(Math.random() * 3))
  scene.add(p2.root)

  appState = "PLAY"
  updateHUD()
}

function updateHUD() {
  if (!p1 || !p2 || !uiManager) return
  uiManager.updateHUD(p1, p2)
  if (appState === "PLAY" && (p1.hp <= 0 || p2.hp <= 0)) {
    appState = "OVER"
    setTimeout(() => {
      uiManager.showGameOver(p1.hp > 0, () => {
        appState = "MENU"
        uiManager.showMenu()
      })
    }, 1500)
  }
}

let frameCount = 0
let fpsLastTime = performance.now()
let fpsEl: HTMLElement | null = null

function ensureFpsElement() {
  if (fpsEl) return fpsEl
  fpsEl = document.createElement("div")
  fpsEl.style.cssText =
    "position:fixed;top:8px;left:8px;z-index:9999;font-family:monospace;font-size:14px;color:#0f0;background:rgba(0,0,0,0.6);padding:4px 8px;border-radius:4px;pointer-events:none;"
  document.body.appendChild(fpsEl)
  return fpsEl
}

function mainLoop(time: number) {
  requestAnimationFrame(mainLoop)
  let dt = (time - lastT) / 1000
  lastT = time
  if (dt > 0.1) dt = 0.1

  frameCount++
  const now = performance.now()
  if (now - fpsLastTime >= 1000) {
    ensureFpsElement().textContent = `FPS: ${frameCount}`
    frameCount = 0
    fpsLastTime = now
  }

  if (gameContext.slowMoTimer > 0) {
    gameContext.slowMoTimer -= dt
    dt *= CFG.slowMoFactor
  }

  if (gameContext.gameHitStop > 0) {
    gameContext.gameHitStop -= dt
  } else {
    if (appState === "PLAY") {
      processPlayerLogic(p1, inputManager.state, vfx)
      if (CFG.enableEnemyAI) aiLogic.update(dt, p2, p1)
      p1.update(dt, p2, vfx, scene, uiManager)
      p2.update(dt, p1, vfx, scene, uiManager)
      updateHUD()
    }
    projectiles.update(
      dt,
      scene,
      appState === "PLAY",
      p1,
      p2,
      vfx
    )
  }
  vfx.update(dt)

  // 环境氛围动画
  updateEnvironment(scene, time)

  const tickTasks = modTick.getTasks()
  for (let i = tickTasks.length - 1; i >= 0; i--) {
    try {
      tickTasks[i].fn(dt)
    } catch (err) {
      console.error("[TICK]", err)
      modTick.remove(tickTasks[i].id)
    }
  }

  if (p1 && p2 && appState === "PLAY") {
    updateCamera(camera, p1, p2, dt)
  } else {
    updateMenuCamera(camera, time)
  }
  renderer.render(scene, camera)
}

function updateEnvironment(scene: THREE.Scene, time: number) {
  const sign = scene.getObjectByName("neonSign") as THREE.Mesh & {
    material: THREE.MeshBasicMaterial
  }
  if (sign) {
    const flicker = 0.85 + Math.sin(time * 0.008) * 0.1 + Math.random() * 0.05
    sign.material.opacity = flicker
  }

  if (CFG.showRain) {
    const rain = scene.getObjectByName("rain") as THREE.Points
    if (rain) {
      const positions = rain.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= 0.8
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 60
          positions[i * 3] = (Math.random() - 0.5) * 120
          positions[i * 3 + 2] = (Math.random() - 0.5) * 60
        }
      }
      rain.geometry.attributes.position.needsUpdate = true
    }
  }
}

init()
