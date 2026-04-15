import * as THREE from "three/webgpu"
import { CFG } from "../config/game-config.ts"

export class VFXEngine {
  scene: THREE.Scene
  particles: Array<{
    m: THREE.Mesh
    life: number
    vx: number
    vy: number
    vz: number
    mat: THREE.Material
  }> = []
  texts: Array<{
    m: THREE.Sprite
    life: number
    vy: number
    mat: THREE.SpriteMaterial
    tex: THREE.CanvasTexture
  }> = []
  trails: Array<{
    m: THREE.Mesh
    life: number
    isBurst: boolean
  }> = []
  fontCanvas: HTMLCanvasElement
  fontCtx: CanvasRenderingContext2D
  boxGeom: THREE.BoxGeometry

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.fontCanvas = document.createElement("canvas")
    const ctx = this.fontCanvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) throw new Error("Failed to get 2d context")
    this.fontCtx = ctx
    this.boxGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3)
  }

  private sparkMats = new Map<number, THREE.MeshBasicMaterial>()

  spawnSparks(pos: THREE.Vector3, color: number, count = 15) {
    let mat = this.sparkMats.get(color)
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color })
      this.sparkMats.set(color, mat)
    }
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(this.boxGeom, mat)
      m.position.copy(pos)
      this.scene.add(m)
      this.particles.push({
        m,
        life: 1.0,
        vx: (Math.random() - 0.5) * 30,
        vy: Math.random() * 25 + 10,
        vz: (Math.random() - 0.5) * 30,
        mat,
      })
    }
  }

  spawnBurst(pos: THREE.Vector3, color: number) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
    })
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 8, 16), mat)
    m.position.copy(pos)
    m.position.y += 1.5
    m.rotation.x = Math.PI / 2
    this.scene.add(m)
    this.trails.push({ m, life: 0.3, isBurst: true })
  }

  spawnTrail(mesh: THREE.Mesh, color: number) {
    const clone = new THREE.Mesh(
      mesh.geometry,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      })
    )
    mesh.getWorldPosition(clone.position)
    mesh.getWorldQuaternion(clone.quaternion)
    clone.scale.copy(mesh.scale)
    this.scene.add(clone)
    this.trails.push({ m: clone, life: 0.2, isBurst: false })
  }

  spawnText(
    pos: THREE.Vector3,
    txt: string,
    color = "#ff0055",
    isCrit = false
  ) {
    this.fontCanvas.width = 256
    this.fontCanvas.height = 128
    this.fontCtx.clearRect(0, 0, 256, 128)
    this.fontCtx.fillStyle = color
    this.fontCtx.font = `900 ${isCrit ? 60 : 45}px Impact`
    this.fontCtx.textAlign = "center"
    this.fontCtx.shadowColor = "#fff"
    this.fontCtx.shadowBlur = 4
    this.fontCtx.fillText(txt, 128, 80)
    const tex = new THREE.CanvasTexture(this.fontCanvas)
    const mat = new THREE.SpriteMaterial({ map: tex })
    const sprite = new THREE.Sprite(mat)
    sprite.position.copy(pos)
    sprite.position.y += 2.5 + Math.random()
    sprite.position.x += Math.random() - 0.5
    sprite.scale.set(4, 2, 1)
    this.scene.add(sprite)
    this.texts.push({ m: sprite, life: 1.0, vy: 5, mat, tex })
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt * 3
      if (p.life <= 0) {
        this.scene.remove(p.m)
        this.particles.splice(i, 1)
      } else {
        p.vy += CFG.g * dt
        p.m.position.set(
          p.m.position.x + p.vx * dt,
          p.m.position.y + p.vy * dt,
          p.m.position.z + p.vz * dt
        )
        p.m.scale.setScalar(p.life)
      }
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]
      t.life -= dt
      if (t.life <= 0) {
        this.scene.remove(t.m)
        t.tex.dispose()
        t.mat.dispose()
        this.texts.splice(i, 1)
      } else {
        t.m.position.y += t.vy * dt
        t.m.material.opacity = t.life
      }
    }

    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i]
      t.life -= dt
      const mat = t.m.material as THREE.Material & { opacity?: number; dispose: () => void }
      if (t.life <= 0) {
        this.scene.remove(t.m)
        mat.dispose()
        this.trails.splice(i, 1)
      } else {
        if (t.isBurst) {
          t.m.scale.addScalar(dt * 15)
          mat.opacity = t.life / 0.3
        } else {
          mat.opacity = (t.life / 0.2) * 0.5
          t.m.scale.multiplyScalar(0.8)
        }
      }
    }
  }
}
