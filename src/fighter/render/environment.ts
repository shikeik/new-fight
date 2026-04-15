import * as THREE from "three"
import { CFG } from "@/fighter/config/game-config.ts"

export function buildEnvironment(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x110515)
  scene.fog = new THREE.FogExp2(0x110515, 0.015)

  scene.add(new THREE.AmbientLight(0x222233, 1.5))
  const rim = new THREE.DirectionalLight(0x00ffff, 2)
  rim.position.set(-10, 20, -10)
  scene.add(rim)
  const fill = new THREE.DirectionalLight(0xff0055, 1.5)
  fill.position.set(10, 10, 10)
  scene.add(fill)

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
  const floor = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 30), floorMat)
  floor.position.y = -1
  scene.add(floor)

  const grid = new THREE.GridHelper(200, 40, 0x555555, 0x333333)
  grid.position.y = 0.02
  scene.add(grid)

  const fenceMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  })
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(200, 20, 100, 10), fenceMat)
  fence.position.set(0, 10, -12)
  scene.add(fence)

  const propGeo = new THREE.BoxGeometry(1, 1, 1)
  const propMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  const props = new THREE.InstancedMesh(propGeo, propMat, 150)
  const mat4 = new THREE.Matrix4()
  for (let i = 0; i < 150; i++) {
    let w: number, h: number, d: number, x: number, y: number, z: number
    if (i < 50) {
      w = 5 + Math.random() * 10
      h = 20 + Math.random() * 40
      d = 5 + Math.random() * 10
      x = (Math.random() - 0.5) * 200
      y = h / 2
      z = -30 - Math.random() * 20
    } else if (i < 100) {
      w = 2 + Math.random() * 4
      h = 5 + Math.random() * 15
      d = 2 + Math.random() * 4
      x = (Math.random() - 0.5) * 150
      y = h / 2
      z = -15 - Math.random() * 10
    } else {
      w = 1 + Math.random() * 3
      h = 1 + Math.random() * 3
      d = 1 + Math.random() * 3
      x = (Math.random() - 0.5) * 100
      y = h / 2
      z = -8 - Math.random() * 3
    }
    mat4.makeTranslation(x, y, z)
    mat4.scale(new THREE.Vector3(w, h, d))
    props.setMatrixAt(i, mat4)
  }
  scene.add(props)

  // ===== 霓虹灯牌（带闪烁） =====
  const signCanvas = document.createElement("canvas")
  signCanvas.width = 512
  signCanvas.height = 256
  const ctx = signCanvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = "#050505"
    ctx.fillRect(0, 0, 512, 256)
    ctx.strokeStyle = "#ff0055"
    ctx.lineWidth = 10
    ctx.strokeRect(10, 10, 492, 236)
    ctx.font = "80px Impact"
    ctx.textAlign = "center"
    ctx.shadowColor = "#00ffff"
    ctx.shadowBlur = 20
    ctx.fillStyle = "#00ffff"
    ctx.fillText("FIGHT CLUB", 256, 100)
    ctx.shadowColor = "#ff0055"
    ctx.fillStyle = "#ff0055"
    ctx.font = "italic 60px Arial Black"
    ctx.fillText("UNDERGROUND", 256, 200)
  }

  const signTex = new THREE.CanvasTexture(signCanvas)
  const signMat = new THREE.MeshBasicMaterial({
    map: signTex,
    transparent: true,
  })
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), signMat)
  sign.position.set(0, 15, -14)
  sign.name = "neonSign"
  scene.add(sign)

  // ===== 雨滴粒子 =====
  if (CFG.showRain) {
    const rainGeo = new THREE.BufferGeometry()
    const rainCount = 4000
    const rainPos = new Float32Array(rainCount * 3)
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 120
      rainPos[i * 3 + 1] = Math.random() * 60
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3))
    const rainMat = new THREE.PointsMaterial({
      color: 0x8899aa,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
    })
    const rain = new THREE.Points(rainGeo, rainMat)
    rain.name = "rain"
    scene.add(rain)
  }
}
