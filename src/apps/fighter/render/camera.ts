import * as THREE from "three"
import { CFG } from "@/apps/fighter/config/game-config.ts"
import type { Character } from "@/apps/fighter/game/character.ts"

export function updateCamera(
  camera: THREE.PerspectiveCamera,
  p1: Character,
  p2: Character,
  dt: number
) {
  const midX = (p1.pos.x + p2.pos.x) / 2
  const midY = (p1.pos.y + p2.pos.y) / 2
  const dist = Math.abs(p1.pos.x - p2.pos.x)
  const aspect = camera.aspect
  const bodyWidth = 1.4
  const bodyHeight = 1.8
  const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360)
  const requiredZX =
    (dist + bodyWidth) /
    (2 * tanHalfFov * aspect * CFG.cameraSafeRatio)
  const dy = Math.abs(p1.pos.y - p2.pos.y) + bodyHeight
  const requiredZY = dy / (2 * tanHalfFov * CFG.cameraSafeRatio)
  const targetZ = Math.max(12, Math.max(requiredZX, requiredZY))
  const targetY = midY + 3.5 + dist * 0.12

  camera.position.x = THREE.MathUtils.lerp(
    camera.position.x,
    midX,
    CFG.cameraLerpX
  )
  camera.position.z = THREE.MathUtils.lerp(
    camera.position.z,
    targetZ,
    CFG.cameraLerpZ
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameCtx = (window as any).__GAME__ as { gameCamShake: number }
  if (gameCtx.gameCamShake > 0) {
    camera.position.x += (Math.random() - 0.5) * gameCtx.gameCamShake * 2
    camera.position.y = targetY + (Math.random() - 0.5) * gameCtx.gameCamShake * 2
    gameCtx.gameCamShake -= dt
  } else {
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetY,
      CFG.cameraLerpY
    )
  }

  camera.lookAt(midX, midY + 2.0, 0)
}

export function updateMenuCamera(
  camera: THREE.PerspectiveCamera,
  time: number
) {
  camera.position.x = Math.sin(time * 0.0005) * 8
  camera.lookAt(0, 3, 0)
}

