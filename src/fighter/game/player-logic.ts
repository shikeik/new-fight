import { ST, CFG } from "../config/game-config.ts"
import { audio } from "../audio/audio-engine.ts"
import type { InputState } from "../types/game.ts"
import type { Character } from "./character.ts"
import type { VFXEngine } from "../render/vfx-engine.ts"

export interface PlayerActions {
  onDash?: () => void
  onJump?: () => void
  onSkill?: () => void
  onAttack?: () => void
}

export function processPlayerLogic(
  p1: Character,
  input: InputState,
  vfx: VFXEngine,
  actions?: PlayerActions
) {
  if (!p1 || p1.state === ST.DEAD) return
  const onGnd = p1.pos.y <= CFG.floorY + 0.1

  // 1. 最高优先级：闪避打断 (Dash Cancel)
  if (input.c) {
    const isAtk = p1.state >= ST.ATK1 && p1.state <= ST.DASH_ATK
    if (onGnd) {
      if (
        isAtk ||
        p1.state === ST.BLOCK ||
        p1.state === ST.SKILL ||
        [ST.IDLE, ST.WALK].includes(p1.state)
      ) {
        if ((isAtk || p1.state === ST.SKILL) && p1.stTimer > 0.05) {
          vfx.spawnBurst(p1.pos, 0x00ffff)
        }
        p1.changeState(ST.DASH)
        audio.sfxDash()
        if (actions?.onDash) actions.onDash()
      }
    } else if (!onGnd && p1.airDashes < 1) {
      p1.airDashes++
      p1.changeState(ST.DASH)
      p1.vel.y = 0
      vfx.spawnBurst(p1.pos, 0xffffff)
      audio.sfxDash()
      if (actions?.onDash) actions.onDash()
    }
    input.c = false
  }

  // 2. 防御拦截
  if (
    input.d &&
    onGnd &&
    ![ST.DASH, ST.SKILL, ST.ATK1, ST.ATK2, ST.ATK3, ST.DASH_ATK].includes(
      p1.state
    )
  ) {
    if (p1.state !== ST.BLOCK) p1.changeState(ST.BLOCK)
    return
  } else if (p1.state === ST.BLOCK && (!input.d || !onGnd)) {
    p1.changeState(ST.IDLE)
  }

  // 3. 常规动作与连招系统
  if ([ST.IDLE, ST.WALK, ST.JUMP, ST.FALL].includes(p1.state)) {
    if (input.x !== 0) {
      p1.vel.x = input.x * p1.stats.spd
      p1.face = input.x
      if (onGnd && p1.state !== ST.WALK) p1.changeState(ST.WALK)
    } else if (onGnd && p1.state === ST.WALK) {
      p1.changeState(ST.IDLE)
    }

    if (input.b && onGnd) {
      p1.vel.y = p1.stats.jmp
      p1.changeState(ST.JUMP)
      audio.play(400, "sine", 0.3, 0.2, 800)
      input.b = false
      if (actions?.onJump) actions.onJump()
    }
    if (input.s && onGnd) {
      p1.changeState(ST.SKILL)
      input.s = false
      if (actions?.onSkill) actions.onSkill()
    }

    if (input.a) {
      if (onGnd) p1.changeState(ST.ATK1)
      else p1.changeState(ST.JUMP_ATK)
      audio[p1.type === 2 ? "sfxSlash" : "sfxSwing"]()
      input.a = false
      if (actions?.onAttack) actions.onAttack()
    }
  } else {
    // 连招流转
    if (input.a && onGnd) {
      if (p1.state === ST.DASH) {
        p1.changeState(ST.DASH_ATK)
        audio[p1.type === 2 ? "sfxSlash" : "sfxSwing"]()
        input.a = false
        if (actions?.onAttack) actions.onAttack()
      } else if (p1.state === ST.ATK1 && p1.stTimer > 0.15) {
        p1.changeState(ST.ATK2)
        audio[p1.type === 2 ? "sfxSlash" : "sfxSwing"]()
        input.a = false
        if (actions?.onAttack) actions.onAttack()
      } else if (p1.state === ST.ATK2 && p1.stTimer > 0.15) {
        p1.changeState(ST.ATK3)
        audio[p1.type === 2 ? "sfxSlash" : "sfxSwing"]()
        input.a = false
        if (actions?.onAttack) actions.onAttack()
      }
    }
    if (
      input.s &&
      onGnd &&
      (p1.state === ST.ATK1 || p1.state === ST.ATK2) &&
      p1.stTimer > 0.15
    ) {
      p1.changeState(ST.SKILL)
      input.s = false
      if (actions?.onSkill) actions.onSkill()
    }
  }
}
