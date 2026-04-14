import { ST, CFG } from "../config/game-config.ts"
import { audio } from "../audio/audio-engine.ts"
import type { Character } from "./character.ts"

export class AIController {
  thinkTimer = 0

  update(dt: number, ai: Character, opp: Character) {
    if (ai.state === ST.DEAD || opp.state === ST.DEAD) return
    if (ai.state === ST.BLOCK) {
      this.thinkTimer -= dt
      if (this.thinkTimer <= 0) ai.changeState(ST.IDLE)
      return
    }
    const onGnd = ai.pos.y <= CFG.floorY + 0.1

    if (ai.state === ST.ATK1 && ai.stTimer > 0.15 && Math.random() < 0.6) {
      ai.changeState(ST.ATK2)
      return
    }
    if (ai.state === ST.ATK2 && ai.stTimer > 0.15 && Math.random() < 0.4) {
      ai.changeState(ST.ATK3)
      return
    }

    if (![ST.IDLE, ST.WALK].includes(ai.state)) return
    this.thinkTimer -= dt
    if (this.thinkTimer > 0) return

    const dist = Math.abs(ai.pos.x - opp.pos.x)
    const isOppAttacking = [
      ST.ATK1,
      ST.ATK2,
      ST.ATK3,
      ST.SKILL,
      ST.JUMP_ATK,
      ST.DASH_ATK,
    ].includes(opp.state)
    ai.face = opp.pos.x > ai.pos.x ? 1 : -1

    if (isOppAttacking && dist < ai.stats.atkRanges[0] * 2.0 && onGnd) {
      if (Math.random() < 0.5) {
        ai.changeState(ST.BLOCK)
        this.thinkTimer = 0.5
        return
      }
      if (Math.random() < 0.3) {
        ai.changeState(ST.DASH)
        ai.face = -ai.face
        ai.vel.x = ai.face * CFG.dodgeSpeed
        this.thinkTimer = 0.5
        return
      }
    }

    if (dist > ai.stats.atkRanges[0] * 1.2) {
      ai.vel.x = ai.face * (ai.stats.spd * 0.7)
      if (onGnd && ai.state !== ST.WALK) ai.changeState(ST.WALK)
      this.thinkTimer = 0.2
    } else if (onGnd) {
      ai.vel.x = 0
      const r = Math.random()
      if (r < 0.4) {
        ai.changeState(ST.ATK1)
        audio[ai.type === 2 ? "sfxSlash" : "sfxSwing"]()
      } else if (r < 0.6 && ai.type !== 1) {
        ai.changeState(ST.SKILL)
      } else {
        ai.changeState(ST.IDLE)
      }
      this.thinkTimer = 0.3
    }
  }
}
