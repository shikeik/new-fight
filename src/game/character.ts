import * as THREE from "three/webgpu"
import { CFG, ST } from "../config/game-config.ts"
import { audio } from "../audio/audio-engine.ts"
import type { VFXEngine } from "../render/vfx-engine.ts"
import type { UIManager } from "../ui/ui-manager.ts"

export class Character {
  isP: boolean
  type: number
  hp = 100
  maxHp = 100
  pos: THREE.Vector3
  vel = new THREE.Vector3(0, 0, 0)
  face: number
  state: number = ST.IDLE
  stTimer = 0
  combo = 0
  comboTimer = 0
  hitConnected = false
  isInvincible = false
  airDashes = 0
  stats: {
    spd: number
    jmp: number
    atkRanges: [number, number]
    dmgMuls: number
  }

  root!: THREE.Group
  body!: THREE.Group
  head!: THREE.Group
  armL!: THREE.Group
  armR!: THREE.Group
  legL!: THREE.Group
  legR!: THREE.Group
  weapon?: THREE.Mesh
  mats: THREE.Material[] = []

  constructor(isPlayer: boolean, typeID: number) {
    this.isP = isPlayer
    this.type = typeID
    this.pos = new THREE.Vector3(isPlayer ? -6 : 6, CFG.floorY, 0)
    this.face = isPlayer ? 1 : -1
    this.stats = {
      spd: [16, 12, 18][typeID],
      jmp: [24, 20, 26][typeID],
      atkRanges: [
        [2.2, 2.2],
        [1.8, 1.8],
        [3.5, 4.0],
      ][typeID] as [number, number],
      dmgMuls: [1.0, 1.6, 1.2][typeID],
    }
    this._buildRig()
  }

  private _buildRig() {
    const skinColor = 0xffe0bd
    const makeNode = (p: THREE.Vector3) => {
      const g = new THREE.Group()
      g.position.copy(p)
      return g
    }
    const makeBox = (
      p: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      col: number,
      offY = 0
    ) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color: col })
      )
      m.position.set(0, offY, 0)
      m.castShadow = true
      m.receiveShadow = true
      p.add(m)
      return m
    }

    this.root = new THREE.Group()
    this.body = makeNode(new THREE.Vector3(0, 1.5, 0))
    this.root.add(this.body)
    this.head = makeNode(new THREE.Vector3(0, 0.8, 0))
    this.body.add(this.head)
    makeBox(this.head, 0.6, 0.6, 0.6, skinColor, 0.3)
    this.armL = makeNode(new THREE.Vector3(-0.7, 0.6, 0))
    this.body.add(this.armL)
    this.armR = makeNode(new THREE.Vector3(0.7, 0.6, 0))
    this.body.add(this.armR)
    this.legL = makeNode(new THREE.Vector3(-0.3, -0.7, 0))
    this.body.add(this.legL)
    this.legR = makeNode(new THREE.Vector3(0.3, -0.7, 0))
    this.body.add(this.legR)

    if (this.type === 0) {
      makeBox(this.body, 1.0, 1.4, 0.6, 0x00ffff)
      makeBox(this.head, 0.65, 0.1, 0.65, 0x222222, 0.5)
      makeBox(this.armL, 0.35, 1.1, 0.35, skinColor, -0.5)
      makeBox(this.armR, 0.35, 1.1, 0.35, skinColor, -0.5)
      makeBox(this.legL, 0.4, 1.2, 0.4, 0x333333, -0.6)
      makeBox(this.legR, 0.4, 1.2, 0.4, 0x333333, -0.6)
    } else if (this.type === 1) {
      makeBox(this.body, 1.3, 1.3, 0.8, skinColor)
      makeBox(this.body, 1.35, 0.4, 0.85, 0x111111, -0.5)
      makeBox(this.armL, 0.4, 0.8, 0.4, skinColor, -0.4)
      makeBox(this.armR, 0.4, 0.8, 0.4, skinColor, -0.4)
      makeBox(this.armL, 0.8, 0.8, 0.8, 0xff0055, -1.0)
      makeBox(this.armR, 0.8, 0.8, 0.8, 0xff0055, -1.0)
      makeBox(this.legL, 0.45, 1.1, 0.45, skinColor, -0.5)
      makeBox(this.legR, 0.45, 1.1, 0.45, skinColor, -0.5)
    } else {
      makeBox(this.body, 0.9, 1.4, 0.5, 0x334455)
      makeBox(this.head, 1.5, 0.1, 1.5, 0x111111, 0.6)
      makeBox(this.armL, 0.3, 1.1, 0.3, 0x222222, -0.5)
      makeBox(this.armR, 0.3, 1.1, 0.3, 0x222222, -0.5)
      makeBox(this.legL, 0.4, 1.1, 0.4, 0x111111, -0.5)
      makeBox(this.legR, 0.4, 1.1, 0.4, 0x111111, -0.5)
      this.weapon = makeBox(this.armR, 0.1, 3.2, 0.2, 0x00ffaa, -1.8)
      this.weapon.rotation.x = Math.PI / 4
    }

    this.root.traverse((c: unknown) => {
      const obj = c as THREE.Object3D & { isMesh?: boolean }
      if (obj.isMesh) {
        const mesh = obj as THREE.Mesh
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        if (mat) this.mats.push(mat)
      }
    })
  }

  getHurtBox(): THREE.Box3 {
    return new THREE.Box3(
      new THREE.Vector3(this.pos.x - 0.7, this.pos.y, -1.0),
      new THREE.Vector3(this.pos.x + 0.7, this.pos.y + 2.8, 1.0)
    )
  }

  getHitBox(isHeavy: boolean): THREE.Box3 {
    const w = this.stats.atkRanges[isHeavy ? 1 : 0]
    return new THREE.Box3(
      new THREE.Vector3(
        this.face > 0 ? this.pos.x : this.pos.x - w,
        this.pos.y + 0.2,
        -1.5
      ),
      new THREE.Vector3(
        this.face > 0 ? this.pos.x + w : this.pos.x,
        this.pos.y + 2.5,
        1.5
      )
    )
  }

  changeState(st: number): void {
    if ([ST.DEAD, ST.WIN].includes(this.state)) return
    this.state = st
    this.stTimer = 0
    this.hitConnected = false
    this.isInvincible = false

    this.body.rotation.set(0, 0, 0)
    this.head.rotation.set(0, 0, 0)
    this.armL.rotation.set(0, 0, 0)
    this.armR.rotation.set(0, 0, 0)
    this.legL.rotation.set(0, 0, 0)
    this.legR.rotation.set(0, 0, 0)
    this.mats.forEach((m: THREE.Material & { opacity?: number; transparent?: boolean }) => {
      m.opacity = 1
      m.transparent = false
    })

    if (st === ST.DASH) {
      this.isInvincible = true
      this.vel.x = this.face * CFG.dodgeSpeed
      this.mats.forEach((m) => {
        const mat = m as THREE.Material & { opacity: number; transparent: boolean }
        mat.opacity = 0.4
        mat.transparent = true
      })
    }
    if (st === ST.BLOCK || st === ST.SKILL) {
      this.vel.x = 0
    }
  }

  takeDamage(
    dmg: number,
    dirX: number,
    isHeavy: boolean,
    vfx: VFXEngine
  ): boolean {
    if (this.isInvincible || this.state === ST.DEAD) return false
    if (this.state === ST.BLOCK && dirX !== this.face) {
      this.hp -= dmg * 0.1
      vfx.spawnSparks(
        new THREE.Vector3(this.pos.x + this.face, this.pos.y + 1.5, 0),
        0x00ffff,
        8
      )
      audio.sfxBlock()
      this.vel.x = dirX * 5
      return true
    }
    this.hp -= dmg
    audio[isHeavy ? "sfxHitHeavy" : "sfxHitLight"]()
    vfx.spawnSparks(
      new THREE.Vector3(this.pos.x, this.pos.y + 1.5, 0),
      isHeavy ? 0xff0055 : 0xffaa00,
      isHeavy ? 25 : 12
    )
    vfx.spawnText(
      new THREE.Vector3(this.pos.x, this.pos.y + 2, 0),
      Math.floor(dmg).toString(),
      isHeavy ? "#ff0055" : "#ffaa00",
      isHeavy
    )

    this.vel.x = dirX * (isHeavy ? 18 : 8)
    this.vel.y = isHeavy ? 10 : 3
    this.mats.forEach((m) => {
      const mat = m as THREE.Material & { emissive?: { setHex: (h: number) => void } }
      if (mat.emissive) mat.emissive.setHex(0xffffff)
    })
    setTimeout(() => {
      if (this.mats) {
        this.mats.forEach((m) => {
          const mat = m as THREE.Material & { emissive?: { setHex: (h: number) => void } }
          if (mat.emissive) mat.emissive.setHex(0x000000)
        })
      }
    }, 80)
    if (this.hp <= 0) {
      this.hp = 0
      this.changeState(ST.DEAD)
    } else {
      this.changeState(ST.HURT)
    }
    return true
  }

  update(
    dt: number,
    opp: Character,
    vfx: VFXEngine,
    scene: THREE.Scene,
    ui?: UIManager
  ): void {
    if (this.state === ST.DEAD || this.state === ST.WIN) {
      this._animate(dt)
      this.root.position.copy(this.pos)
      return
    }

    this.stTimer += dt
    if (this.comboTimer > 0) this.comboTimer -= dt
    else this.combo = 0
    const onGnd = this.pos.y <= CFG.floorY + 0.05

    if (onGnd) this.airDashes = 0

    if (!onGnd) {
      if (this.state === ST.DASH) this.vel.y = 0
      else this.vel.y += CFG.g * dt
    } else if (this.vel.y < 0) {
      this.vel.y = 0
      this.pos.y = CFG.floorY
      if ([ST.FALL, ST.HURT, ST.JUMP_ATK].includes(this.state))
        this.changeState(ST.IDLE)
    }

    if (onGnd && ![ST.WALK, ST.DASH, ST.DASH_ATK].includes(this.state))
      this.vel.x *= 0.6

    if (
      [ST.ATK1, ST.ATK2, ST.ATK3, ST.JUMP_ATK, ST.DASH_ATK].includes(
        this.state
      )
    ) {
      const isHeavy = this.state === ST.ATK3 || this.state === ST.JUMP_ATK
      const isDashAtk = this.state === ST.DASH_ATK

      if (onGnd && this.stTimer < 0.1 && !isDashAtk)
        this.vel.x = this.face * (isHeavy ? 10 : 4)
      if (isDashAtk && this.stTimer < 0.25) this.vel.x = this.face * 22

      const activeStart = isHeavy ? 0.2 : isDashAtk ? 0.1 : 0.1
      const activeEnd = isHeavy ? 0.4 : isDashAtk ? 0.3 : 0.2

      if (this.stTimer >= activeStart && this.stTimer <= activeEnd) {
        if (this.type === 2 && this.stTimer < activeStart + 0.05)
          vfx.spawnTrail(this.weapon!, 0x00ffaa)
        if (!this.hitConnected) {
          if (this.getHitBox(isHeavy || isDashAtk).intersectsBox(opp.getHurtBox())) {
            if (
              opp.takeDamage(
                (isHeavy ? 18 : 10) * this.stats.dmgMuls,
                this.face,
                isHeavy,
                vfx
              )
            ) {
              this.hitConnected = true
              if (this.isP) {
                this.combo++
                this.comboTimer = 2.0
                if (ui) ui.showCombo(this.combo)
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(window as any).__GAME__.gameHitStop = isHeavy ? 0.15 : 0.08
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(window as any).__GAME__.gameCamShake = isHeavy ? 0.8 : 0.3
            }
          }
        }
      }
      if (
        onGnd &&
        this.state !== ST.JUMP_ATK &&
        this.stTimer > (isHeavy ? 0.6 : 0.4)
      )
        this.changeState(ST.IDLE)
    }

    if (this.state === ST.DASH && this.stTimer > 0.3)
      this.changeState(onGnd ? ST.IDLE : ST.FALL)
    if (this.state === ST.HURT && this.stTimer > 0.4 && onGnd)
      this.changeState(ST.IDLE)
    if (this.state === ST.SKILL) {
      if (this.stTimer > 0.2 && !this.hitConnected) {
        this.hitConnected = true
        audio.sfxShoot()
        const projMat = new THREE.MeshBasicMaterial({
          color: this.type === 1 ? 0xff0055 : 0x00aaff,
          wireframe: true,
        })
        const proj = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.8, 1),
          projMat
        )
        proj.position.set(this.pos.x + this.face * 2, this.pos.y + 1.5, 0)
        scene.add(proj)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).__GAME__.sysProjectiles.push({
          m: proj,
          vx: this.face * 35,
          owner: this,
          life: 1.5,
          mat: projMat,
        })
      }
      if (this.stTimer > 0.6) this.changeState(ST.IDLE)
    }

    this.pos.addScaledVector(this.vel, dt)
    this.pos.x = Math.max(-25, Math.min(25, this.pos.x))

    if (
      opp.state !== ST.DEAD &&
      this.state !== ST.DASH &&
      opp.state !== ST.DASH
    ) {
      const dx = opp.pos.x - this.pos.x
      const dy = Math.abs(opp.pos.y - this.pos.y)
      if (Math.abs(dx) < 1.4 && dy < 1.8)
        this.pos.x = opp.pos.x - Math.sign(dx) * 1.4
    }

    this.root.position.copy(this.pos)
    this.root.rotation.y = THREE.MathUtils.lerp(
      this.root.rotation.y,
      this.face > 0 ? Math.PI / 2 : -Math.PI / 2,
      0.4
    )
    this._animate(dt)
  }

  private _animate(_dt: number): void {
    const t = this.stTimer
    const pi = Math.PI
    switch (this.state) {
      case ST.IDLE:
        this.body.position.y = 1.5 + Math.sin(t * 5) * 0.06
        this.armL.rotation.x = Math.sin(t * 2) * 0.1
        this.armR.rotation.x = this.type === 2 ? 0.5 : Math.sin(t * 2 + pi) * 0.1
        break
      case ST.WALK:
        this.body.position.y = 1.5 + Math.abs(Math.sin(t * 18)) * 0.15
        this.armL.rotation.x = Math.sin(t * 15) * 1.2
        this.armR.rotation.x = this.type === 2 ? 0.5 : -Math.sin(t * 15) * 1.2
        this.legL.rotation.x = -Math.sin(t * 15) * 1.2
        this.legR.rotation.x = Math.sin(t * 15) * 1.2
        break
      case ST.JUMP:
      case ST.FALL:
        this.legL.rotation.x = 0.5
        this.legR.rotation.x = -0.2
        this.armL.rotation.x = 0.8
        this.armR.rotation.x = -0.8
        break
      case ST.ATK1:
      case ST.ATK2:
        {
          const isLeft = this.state === ST.ATK1
          const arm = isLeft ? this.armL : this.armR
          if (this.type === 2) {
            if (t < 0.1) {
              this.armR.rotation.x = -t * 30
              this.body.rotation.x = 0.3
            } else {
              this.armR.rotation.x = THREE.MathUtils.lerp(
                this.armR.rotation.x,
                0,
                0.3
              )
              this.body.rotation.x = 0
            }
          } else {
            if (t < 0.1) {
              arm.rotation.x = -t * 25
              this.body.rotation.y = isLeft ? 0.6 : -0.6
            } else {
              arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0, 0.4)
              this.body.rotation.y = 0
            }
          }
        }
        break
      case ST.ATK3:
        if (this.type === 2) {
          if (t < 0.2) {
            this.armR.rotation.x = 2.5
            this.body.rotation.x = -0.4
          } else if (t < 0.3) {
            this.armR.rotation.x = -2.8
            this.body.rotation.x = 0.6
          } else {
            this.armR.rotation.x = THREE.MathUtils.lerp(
              this.armR.rotation.x,
              0,
              0.2
            )
            this.body.rotation.x = 0
          }
        } else {
          if (t < 0.2) {
            this.armR.rotation.x = 1.0
            this.body.position.y = 1.0
          } else if (t < 0.3) {
            this.armR.rotation.x = -3.5
            this.body.position.y = 2.2
          } else {
            this.armR.rotation.x = THREE.MathUtils.lerp(
              this.armR.rotation.x,
              0,
              0.2
            )
            this.body.position.y = 1.5
          }
        }
        break
      case ST.JUMP_ATK:
        this.legL.rotation.x = -0.5
        this.legR.rotation.x = 0.5
        this.armR.rotation.x = -3.0
        this.body.rotation.x = 0.5
        break
      case ST.DASH_ATK:
        this.body.rotation.x = 0.8
        this.armR.rotation.x = -1.8
        this.armL.rotation.x = 1.0
        this.legL.rotation.x = -0.8
        this.legR.rotation.x = 0.5
        break
      case ST.BLOCK:
        this.armL.rotation.x = -1.8
        this.armR.rotation.x = -1.8
        this.armL.rotation.z = 0.6
        this.armR.rotation.z = -0.6
        this.body.rotation.x = 0.3
        break
      case ST.DASH:
        this.body.rotation.x = 0.7
        this.armL.rotation.x = 1.2
        this.armR.rotation.x = 1.2
        this.head.rotation.x = -0.6
        break
      case ST.SKILL:
        if (t < 0.2) {
          this.armL.rotation.x = 2.5
          this.armR.rotation.x = 2.5
        } else {
          this.armL.rotation.x = -1.5
          this.armR.rotation.x = -1.5
        }
        break
      case ST.HURT:
        this.body.rotation.x = -0.8
        this.head.rotation.x = 0.5
        this.armL.rotation.x = -0.5
        this.armR.rotation.x = -0.5
        break
      case ST.DEAD:
        this.body.rotation.x = -pi / 2
        this.body.position.y = 0.6
        this.legL.rotation.x = 0
        this.legR.rotation.x = 0
        break
      case ST.WIN:
        this.body.rotation.x = 0
        this.armL.rotation.z = 3.0
        this.armR.rotation.z = -3.0
        this.head.rotation.x = Math.sin(t * 12) * 0.15
        break
    }
  }
}
