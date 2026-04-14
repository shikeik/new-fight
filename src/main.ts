import * as THREE from "three/webgpu"
import mountIndexedDB from "@shikeik/eruda-indexeddb"

import { normalizeResult, makeSuccessResult, makeErrorResult } from "./lib/eval-engine.ts"
import { modTick } from "./infra/mod-tick.ts"
import { logs } from "./infra/log-capture.ts"
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

// 确保 eval-api 向后兼容
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).modTick = modTick
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).logs = logs
}

// ===== HMR Eval Bridge =====
const hot = import.meta.hot
if (hot) {
  hot.on("api-eval-request", async (data) => {
    let res
    try {
      let raw = eval(data.code)
      if (raw && typeof raw === "object" && typeof raw.then === "function") {
        raw = await raw
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
// eslint-disable-next-line no-undef
if (typeof eruda !== "undefined" && eruda.get) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
  mountIndexedDB(eruda as any)
}

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGPURenderer
let vfx: VFXEngine
let p1: Character, p2: Character
const aiLogic = new AIController()
let lastT = performance.now()
let appState: AppState = "MENU"
let inputManager: InputManager
let uiManager: UIManager
const projectiles = new ProjectileSystem()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).sysProjectiles = projectiles.items
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).gameHitStop = 0
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).gameCamShake = 0

async function init() {
  const canvasBox = document.getElementById("canvas-container")
  if (!canvasBox) return

  renderer = new THREE.WebGPURenderer({
    antialias: true,
    powerPreference: "high-performance",
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  canvasBox.appendChild(renderer.domElement)
  await renderer.init()

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).sysProjectiles = projectiles.items

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

function mainLoop(time: number) {
  requestAnimationFrame(mainLoop)
  let dt = (time - lastT) / 1000
  lastT = time
  if (dt > 0.1) dt = 0.1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).gameHitStop > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).gameHitStop -= dt
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

init()
