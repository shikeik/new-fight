import * as THREE from "three"
import type { Character } from "./character.ts"
import type { VFXEngine } from "../render/vfx-engine.ts"

export interface Projectile {
  m: THREE.Mesh
  vx: number
  owner: Character
  life: number
  mat: THREE.Material
}

export class ProjectileSystem {
  items: Projectile[] = []

  add(p: Projectile) {
    this.items.push(p)
  }

  update(dt: number, scene: THREE.Scene, isPlaying: boolean, p1: Character, p2: Character, vfx: VFXEngine) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const pr = this.items[i]
      pr.m.position.x += pr.vx * dt
      pr.m.rotation.y += dt * 15
      pr.life -= dt

      if (isPlaying) {
        const opp = pr.owner === p1 ? p2 : p1
        if (
          new THREE.Box3().setFromObject(pr.m).intersectsBox(opp.getHurtBox()) &&
          opp.state !== 11 // ST.DEAD
        ) {
          opp.takeDamage(20, Math.sign(pr.vx), true, vfx)
          vfx.spawnSparks(pr.m.position, 0x00ffff, 20)
          pr.life = 0
        }
      }

      if (pr.life <= 0) {
        scene.remove(pr.m)
        pr.mat.dispose()
        this.items.splice(i, 1)
      }
    }
  }

  clear(scene: THREE.Scene) {
    this.items.forEach((p) => {
      scene.remove(p.m)
      p.mat.dispose()
    })
    this.items.length = 0
  }
}
